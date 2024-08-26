import { serverurl } from '../config'

export async function signInWithEthereum() {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to use this feature.');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];

        // Create a message to sign
        const message = `Sign this message to authenticate with ${window.location.hostname}`;
        
        // Sign the message
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, address]
        });

        // Send the signed message to the server
        const response = await fetch(`${serverurl}/auth/ethereum`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: address,
                signature: signature,
                message: message
            }),
            credentials: 'include'
        });

        if (response.ok) {
            window.location.reload();
        } else {
            console.log("response", response)
            alert('Authentication failed. Please try again.');
        }
    } catch (error) {
        console.error('Ethereum authentication error:', error);
        alert('An error occurred during authentication. Please try again.');
    }
}
