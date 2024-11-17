const chatbotToggle = document.getElementById("chatbot-toggle");
const chatbotContainer = document.getElementById("chatbot-container");
const closeChatbot = document.getElementById("close-chatbot");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotSend = document.getElementById("chatbot-send");

// OpenAI API Configuration (For Development Only; Use Secure Backend for Production)
const OPENAI_API_KEY = "secret";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Toggle chatbot visibility
chatbotToggle.addEventListener("click", () => {
    chatbotContainer.classList.add("active");
    chatbotToggle.style.display = "none";
});

closeChatbot.addEventListener("click", () => {
    chatbotContainer.classList.remove("active");
    chatbotToggle.style.display = "block";
});

// Handle user message sending
function handleSendMessage() {
    const userMessage = chatbotInput.value.trim();
    if (userMessage) {
        addMessage("You", userMessage);
        chatbotInput.value = "";
        addMessage("MelBot", "Typing...");
        getGPTResponse(userMessage).then(updateLastBotMessage);
    }
}

chatbotSend.addEventListener("click", handleSendMessage);
chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleSendMessage();
    }
});

// Add a message to the chat window
function addMessage(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", "manhole-weight");
    messageElement.classList.add("chat-message", sender.toLowerCase());
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Auto-scroll to the latest message
}

// Update the last bot message dynamically
function updateLastBotMessage(message) {
    const botMessages = chatbotMessages.querySelectorAll(".chat-message.melbot");
    const lastBotMessage = botMessages[botMessages.length - 1];
    if (lastBotMessage) {
        lastBotMessage.innerHTML = `<strong>MelBot:</strong> ${message}`;
    }
}

// Fetch GPT response directly
async function getGPTResponse(userMessage) {
    try {
        // Get current time, date, and day
        const now = new Date();
        const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const currentDate = now.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
        const currentDay = now.toLocaleDateString([], { weekday: 'long' });

        let locationMessage = "";

        // // Get the user's current location
        // if (navigator.geolocation) {
        //     locationMessage = await new Promise((resolve) => {
        //         navigator.geolocation.getCurrentPosition(
        //             (position) => {
        //                 const { latitude, longitude } = position.coords;
        //                 resolve(`The user's current location is latitude: ${latitude}, longitude: ${longitude}.`);
        //             },
        //             (error) => {
        //                 console.error("Geolocation error:", error);
        //                 resolve("Unable to retrieve the user's current location.");
        //             }
        //         );
        //     });
        // } else {
        //     locationMessage = "Geolocation is not supported by this browser.";
        // }

        // Define schedule information
        const scheduleInfo = `

        KEEP IN MIND: YOU CAN GET FROM ONE STATION TO THE UPCOMING ONE ON THE LIST
        Bus schedules for the gold line stops are as follows:

                - **Rush Rhees Library**:
          - AM: 9:00, 10:25
          - AM/PM: 11:50, 12:40
          - PM: 2:05, 4:05, 5:30, 6:55, 8:20, 9:45

        - **Monroe & Alexander**:
          - AM: 9:13, 10:38
          - AM/PM: 12:03
          - PM: 1:28, 2:53, 4:18, 5:43, 7:08, 8:33, 9:58

        - **Park & Culver**:
          - AM: 9:20, 10:45
          - AM/PM: 12:10
          - PM: 1:35, 3:00, 4:25, 5:50, 7:15, 8:40, 10:05

        - **Innovation Square**:
          - AM: 9:36, 11:01
          - AM/PM: 12:26
          - PM: 1:51, 3:16, 4:41, 6:06, 7:31, 8:56, 10:21

        Bus schedules for key stops on the Green Zone Saturday route are as follows:

        - **Rush Rhees Library**:
          - PM: 12:00, 12:30, 1:00, 1:30, 2:00, 2:30, 3:00, 3:30, 4:00, 4:30, 5:00, 5:30, 6:00, 7:00, 8:00, 9:00, 10:00

        - **Crittenden/West Henrietta**:
          - PM: 12:09, 12:39, 1:09, 1:39, 2:09, 2:39, 3:09, 3:39, 4:09, 4:39, 5:09, 5:39, 6:09, 7:09, 8:09, 9:09, 10:09

        - **Jefferson Plaza**:
          - PM: 12:15, 12:45, 1:15, 1:45, 2:15, 2:45, 3:15, 3:45, 4:15, 4:45, 5:15, 5:45, 6:15, 7:15, 8:15, 9:15, 10:15  

        - **Wal-Mart/International Food Market**:
        - PM: 12:33, 1:03, 1:33, 2:03, 2:33, 3:03, 3:33, 4:03, 4:33, 5:03, 5:33, 6:03, 6:33, 7:33, 8:33, 9:33, 10:33

        IN ORDER TO ESTIMATE THE TIME OF ARRIVAL, YOU CAN USE THE FOLLOWING FORMULA: 
        USE STARTING STATION, TAKE THE NEXT AVAILABLE BUS, THEN LOOK FOR THE DESTINATION STATION.
        `;

        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: `You are MelBot, a highly knowledgeable and friendly assistant for the University of Rochester's bus shuttle web application. 
                        Your primary responsibilities are:
                        1. Helping users find the nearest shuttle stop from their current location or a specific point on the map.
                        2. Providing detailed information about shuttle schedules, including departure and arrival times.
                        3. Answering questions about bus routes, delays, and alternative travel options.
                        4. Explaining how to use the web application, such as selecting stops, viewing routes, and understanding travel times.
                        5. Offering clear, concise, and helpful answers to improve the user experience.

                        Respond in a professional yet approachable tone, using simple language where necessary. If you don't have specific data about a query, suggest general advice or direct the user to an administrator.

                        The current day is ${currentDay}, the date is ${currentDate}, and the time is ${currentTime}.
                        ${locationMessage}
                        ${scheduleInfo}
                        `
                    },
                    { role: "user", content: userMessage },
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content;
        } else {
            console.error("OpenAI API Error:", response.statusText);
            return "Sorry, I couldn't process that.";
        }
    } catch (error) {
        console.error("Error:", error);
        return "There was an error connecting to the server.";
    }

    
}


// Make chatbot draggable with screen boundary restrictions
let isDragging = false;
let offsetX, offsetY;

function startDrag(e) {
    isDragging = true;
    offsetX = e.clientX - chatbotContainer.offsetLeft;
    offsetY = e.clientY - chatbotContainer.offsetTop;
    chatbotContainer.style.cursor = "grabbing";
}

function onDrag(e) {
    if (isDragging) {
        const left = Math.max(0, e.clientX - offsetX);
        const top = Math.max(0, e.clientY - offsetY);
        const maxBottom = window.innerHeight - chatbotContainer.offsetHeight;

        chatbotContainer.style.left = `${left}px`;
        chatbotContainer.style.top = `${Math.min(top, maxBottom)}px`;

        // Synchronize toggle position
        chatbotToggle.style.left = `${left}px`;
        chatbotToggle.style.top = `${Math.min(top, maxBottom) + chatbotContainer.offsetHeight}px`;
    }
}

function stopDrag() {
    isDragging = false;
    chatbotContainer.style.cursor = "grab";
}

chatbotContainer.addEventListener("mousedown", startDrag);
document.addEventListener("mousemove", onDrag);
document.addEventListener("mouseup", stopDrag);

