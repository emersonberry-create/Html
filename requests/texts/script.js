// Change this to the name of the chat you are currently in
const chatName = "groupchatname"; 
const chatUrl = `/Scripts/website/requests/texts/${chatName}.json`;

// 1. Function to Load and Display Messages
async function refreshChat() {
    const chatbox = document.getElementById('chatbox');
    
    try {
        const response = await fetch(chatUrl);
        
        // If NGINX returns 404, you aren't in the chat (or it doesn't exist)
        if (response.status === 404) {
            chatbox.innerHTML = "<div>dis ain't yo chat</div>";
            return;
        }

        const data = await response.json();
        
        // Clear and rebuild chatbox
        chatbox.innerHTML = ''; 
        data.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message');
            // Check if message is from you or someone else
            msgDiv.classList.add(msg.user === "YOUR_USERNAME" ? 'user-message' : 'other-message');
            msgDiv.textContent = `${msg.user}: ${msg.text}`;
            chatbox.appendChild(msgDiv);
        });

        chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
        console.error("Failed to load messages:", error);
    }
}

// 2. Function to Send a Message
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const messageText = userInput.value.trim();
    if (messageText === '') return;

    try {
        // NOTE: You need a backend script (e.g., save_chat.php or a Node route) 
        // to actually append the message to the .json file.
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat: chatName,
                text: messageText 
            })
        });

        if (response.ok) {
            userInput.value = '';
            refreshChat(); // Reload immediately after sending
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// 3. Auto-refresh every 3 seconds
setInterval(refreshChat, 3000);
refreshChat(); // Initial load

