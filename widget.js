(function () {

    console.log("W4-Agent Widget Loaded");

    const config = window.W4AgentConfig || {};

    const API_URL = config.apiUrl;
    const TENANT_ID = config.tenantId || "default";

    let sessionId =
    localStorage.getItem("w4_session");

    if (!sessionId) {

        sessionId =
            crypto.randomUUID();

        localStorage.setItem(
            "w4_session",
            sessionId
        );
    }

    if (!API_URL) {
        console.error(
            "W4-Agent: apiUrl is not configured."
        );
        return;
    }

    console.log(
    "Session ID:",
    sessionId
    );

    const style = document.createElement("style");

    style.innerHTML = `
    #w4-agent-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;

        padding: 12px 20px;

        border: none;
        border-radius: 8px;

        cursor: pointer;

        background: #2563eb;
        color: white;

        font-size: 14px;
        font-weight: 600;
    }

    #w4-chat-window {
        position: fixed;

        bottom: 80px;
        right: 20px;

        width: 350px;
        height: 500px;

        background: white;

        border-radius: 10px;

        box-shadow: 0 4px 20px rgba(0,0,0,0.2);

        display: none;

        flex-direction: column;

        z-index: 99999;
    }

    #w4-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        padding: 15px;

        border-bottom: 1px solid #ddd;

        font-weight: bold;
    }

    #w4-input-area {
        display: flex;

        align-items: center;

        gap: 8px;

        padding: 10px;

        border-top: 1px solid #ddd;
    }

    #w4-input {
        flex: 1;

        padding: 10px;

        border: 1px solid #ccc;

        border-radius: 8px;

        outline: none;
    }

    #w4-send {

        padding: 10px 15px;

        border: none;

        border-radius: 8px;

        background: #2563eb;

        color: white;

        cursor: pointer;
    }

    #w4-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;

        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .w4-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 18px;
        word-wrap: break-word;
    }

    .w4-user-message {
        align-self: flex-end;

        background: #2563eb;
        color: white;

        border-bottom-right-radius: 4px;
    }

    .w4-agent-message {
        align-self: flex-start;

        background: #f1f5f9;
        color: #111827;

        border-bottom-left-radius: 4px;
    }

    #w4-header-buttons {
        display: flex;
        gap: 8px;
    }

    #w4-minimize,
    #w4-close {

        border: none;
        background: transparent;

        cursor: pointer;

        font-size: 18px;
    }
       
    #w4-typing {

        font-size: 12px;

        color: #6b7280;

        margin-left: 10px;

        padding: 4px 0;

        font-style: italic;
    }

    `;

    document.head.appendChild(style);

    const button = document.createElement("button");

    button.id = "w4-agent-button";
    button.innerText = "Ask W4-Agent";

    document.body.appendChild(button);

    const chatWindow = document.createElement("div");

    chatWindow.id = "w4-chat-window";

    chatWindow.innerHTML = `
        <div id="w4-header">

            <span>W4-Agent</span>

            <div id="w4-header-buttons">

                <button id="w4-minimize">
                    -
                </button>

                <button id="w4-close">
                    &times;
                </button>

            </div>

        </div>

        <div id="w4-messages">
            <div class="w4-message w4-agent-message">
                Hello! I'm W4-Agent. I can help you with recommending product for your needs
            </div>
        </div>

        <div id="w4-input-area">
            <input
                id="w4-input"
                type="text"
                placeholder="Type your message..."
            />

            <button id="w4-send">
                Send
            </button>
        </div>
    `;

    document.body.appendChild(chatWindow);

    const closeButton =
    document.getElementById(
        "w4-close"
    );

    const minimizeButton =
    document.getElementById(
        "w4-minimize"
    );

    closeButton.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Start a new conversation?"
                );

            if (confirmed) {
                resetChat();
            }
        }
    );

    minimizeButton.addEventListener(
        "click",
        () => {
            chatWindow.style.display =
                "none";
        }
    );

    const messagesContainer =
    document.getElementById(
        "w4-messages"
    );

    loadChatHistory();

    const inputField =
        document.getElementById(
            "w4-input"
        );

    const sendButton =
        document.getElementById(
            "w4-send"
    );

    button.addEventListener("click", () => {
    
    const isOpen =
    chatWindow.style.display === "flex";

    chatWindow.style.display =
    isOpen ? "none" : "flex";

    });

    function addMessage(sender, text) {

        const message =
            document.createElement("div");

        message.classList.add("w4-message");

        if (sender === "You") {
            message.classList.add(
                "w4-user-message"
            );
        }
        else {
            message.classList.add(
                "w4-agent-message"
            );
        }

        message.textContent = text;

        messagesContainer.appendChild(
            message
        );

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

        saveChatHistory();
    }


    async function sendToBackend(message) {
        console.log(
            "Sending request..."
        );

        console.log({
            tenant_id: TENANT_ID,
            session_id: sessionId,
            message: message
        });

        const response = await fetch(
            `${API_URL}/chat/`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    tenant_id: TENANT_ID,
                    session_id: sessionId,
                    message: message
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to contact backend"
            );
        }

        return await response.json();
    }

    sendButton.addEventListener(
        "click",
        handleSend
    );


    async function handleSend() {

        const text =
            inputField.value.trim();

        if (!text) {
            return;
        }

        addMessage(
            "You",
            text
        );

        inputField.value = "";

        try {
            showTyping();

            const result =
                await sendToBackend(
                    text
                );

            console.log(
                "Backend response:",
                result
            );

            hideTyping();

            addMessage(
                "W4-Agent",
                result.reply
            );

        }
        catch (error) {
            hideTyping();

            console.error(error);

            addMessage(
                "W4-Agent",
                "Sorry, I couldn't reach the server."
            );
        }
    }

    inputField.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {
                handleSend();
            }

        }
    );

    function showTyping() {

        const typing =
            document.createElement("div");

        typing.id = "w4-typing";

        const statuses = [
            "Let me think...",
            "Looking into that...",
            "One moment while I review that..."
        ];

        typing.textContent =
            statuses[Math.floor(Math.random() * statuses.length)];

        messagesContainer.appendChild(
            typing
        );

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;
    }

    function hideTyping() {

        const typing =
            document.getElementById(
                "w4-typing"
            );

        if (typing) {
            typing.remove();
        }
    }

    function saveChatHistory() {

        const typing =
            document.getElementById(
                "w4-typing"
            );

        let historyHtml =
            messagesContainer.innerHTML;

        if (typing) {
            historyHtml =
                historyHtml.replace(
                    typing.outerHTML,
                    ""
                );
        }

        localStorage.setItem(
            "w4_chat_history",
            historyHtml
        );
    }

    function loadChatHistory() {

        const history =
            localStorage.getItem(
                "w4_chat_history"
            );

        if (history) {
            messagesContainer.innerHTML =
                history;
        }
    }

    function resetChat() {

        localStorage.removeItem(
            "w4_chat_history"
        );

        localStorage.removeItem(
            "w4_session"
        );

        location.reload();
    }

})();


