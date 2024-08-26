const Router = require('express').Router
const passport = require('passport')
const ethUtil = require('ethereumjs-util')
const models = require('../../models')
const config = require('../../config')
const logger = require('../../logger')
const { setReturnToFromReferer } = require('../utils')
const { urlencodedParser } = require('../../utils')
const express = require('express')

const ethereumAuth = module.exports = Router()

passport.use('ethereum', new (require('passport-custom'))(async (req, done) => {
  try {

    const { address, signature, message } = req.body;

    // Validate required fields
    if (!address || !signature || !message) {
      logger.error('Missing required fields in request body');
      return done(null, false, { message: 'Missing required fields' });
    }

    // Log the received data for debugging
    logger.debug('Received request body:', req.body);
    
    logger.debug(`Auth attempt for address: ${address}`)
    logger.debug(`Message: ${message}`)
    logger.debug(`Signature: ${signature}`)

    // Verify the signature
    const msgBuffer = Buffer.from(message, 'utf8')
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer)
    const signatureBuffer = ethUtil.toBuffer(signature)
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer)
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    )
    const addressBuffer = ethUtil.publicToAddress(publicKey)
    const recoveredAddress = ethUtil.bufferToHex(addressBuffer)

    logger.debug(`Recovered address: ${recoveredAddress}`)

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      logger.debug('Invalid signature: addresses do not match')
      return done(null, false, { message: 'Invalid signature' })
    }

    logger.debug('Signature verified successfully')

    const [user, created] = await models.User.findOrCreate({
      where: { ethereumAddress: address },
      defaults: {
        profile: JSON.stringify({
          id: `ETH-${address}`,
          displayName: `ETH-${address.substr(0, 6)}`,
          provider: 'ethereum'
        })
      }
    })

    logger.debug(`User ${created ? 'created' : 'found'} with id: ${user.id}`)
    return done(null, user)
  } catch (err) {
    logger.error('Ethereum auth error:', err)
    return done(err)
  }
}))

ethereumAuth.post('/auth/ethereum', urlencodedParser, express.json(), (req, res, next) => {
  console.log("the body ", req.body)
  passport.authenticate('ethereum', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/',
    failureFlash: 'Invalid Ethereum signature.'
  })(req, res, next)
})