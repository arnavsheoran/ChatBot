document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatWindow = document.getElementById('chatWindow');

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage(message, 'user');
        userInput.value = '';
        sendMessageToBackend(message);
    });

    // Adds a chat bubble
    function appendMessage(text, sender, id = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        if (id) messageDiv.id = id;

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return messageDiv;
    }

    // Adds typing indicator
    function appendTypingIndicator() {
        return appendMessage('Anime Friend is typing...', 'bot', 'typingIndicator');
    }

    // Send request to Gemini API
    async function sendMessageToBackend(message) {
        const typingIndicator = appendTypingIndicator();

        try {
            const apiKey = "AIzaSyBrJ1MaGzph_Q0bCcOENWNwYNPoNUud8aI";  // <-- insert your actual key

            // System prompt (your Anime Friend rules)
            const system_prompt = `
    You are user's Anime friend , a friendly and helpful AI assistant for recommending anime to the user.
    Your primary goal is to assist users by gathering all the necessary details for their choice of anime. choose the anime from internet platforms such as crunchyroll.

    Follow these steps in the conversation:
    1. Greet the user warmly and introduce yourself.
    2. Ask the user about what type of anime they like.
    3. Ask about any special requirements (action, adventure, Isekai, slice of life, romance, mecha).
    4. Once you have all details, recommend *at least 3 anime titles only (no descriptions)*.
    5. If they ask for more anime then provide similar anime from that genre.
    6. Respond in *plain text only*.
    7. answers should be breif and to the point.
    `;

            // TOKEN-EFFICIENT PAYLOAD (Gemini 2.0 Flash)
            const payload = {
                systemInstruction: {
                    role: "system",
                    parts: [{ text: system_prompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: message }]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 120,        // Lower token usage
                    temperature: 0.5,            // Fast + consistent
                    topP: 0.9,
                    topK: 40,
                }
            };

            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();
            console.log("Gemini Response:", data);

            if (data.error) {
                throw new Error(data.error.message);
            }

            let botResponse = "I’m having trouble responding right now.";

            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                botResponse = data.candidates[0].content.parts[0].text;
            }

            chatWindow.removeChild(typingIndicator);
            appendMessage(botResponse, "bot");

        } catch (error) {
            console.error("Gemini API error:", error);

            if (chatWindow.contains(typingIndicator)) {
                chatWindow.removeChild(typingIndicator);
            }
            appendMessage("Error: " + error.message, "bot");
        }
    }
});
