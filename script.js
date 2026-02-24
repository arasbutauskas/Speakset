const form = document.getElementById("message-form");
const input = document.getElementById("message");
const messageList = document.querySelector(".message-list");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const article = document.createElement("article");
  article.className = "message";

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  article.innerHTML = `
    <div class="avatar">SS</div>
    <div>
      <p><strong>speakset-user</strong> <span>Today at ${timestamp}</span></p>
      <p></p>
    </div>
  `;

  article.querySelectorAll("p")[1].textContent = text;
  messageList.appendChild(article);
  messageList.scrollTop = messageList.scrollHeight;
  input.value = "";
});
