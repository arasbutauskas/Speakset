const authScreen = document.getElementById('auth-screen');
const app = document.getElementById('app');
const authMeta = document.getElementById('auth-meta');

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const avatarInput = document.getElementById('avatar');

const createSpaceButton = document.getElementById('create-space');
const spaceList = document.getElementById('space-list');
const spaceName = document.getElementById('space-name');
const inviteLink = document.getElementById('invite-link');
const userRole = document.getElementById('user-role');

const textChannels = document.getElementById('text-channels');
const privateChannels = document.getElementById('private-channels');
const channelName = document.getElementById('channel-name');
const typingIndicator = document.getElementById('typing-indicator');
const messageList = document.getElementById('message-list');
const composer = document.getElementById('composer');
const messageInput = document.getElementById('message-input');
const template = document.getElementById('message-template');

const state = {
  jwt: '',
  user: null,
  spaces: [
    {
      id: crypto.randomUUID(),
      name: 'Dev Lounge',
      role: 'Owner',
      invite: 'speakset.gg/dev-lounge',
      channels: {
        text: ['general', 'build-log', 'ship-it'],
        private: ['owners-room', 'ops-notes'],
      },
    },
    {
      id: crypto.randomUUID(),
      name: 'Campus Crew',
      role: 'Member',
      invite: 'speakset.gg/campus-crew',
      channels: {
        text: ['general', 'events', 'memes'],
        private: ['mod-chat'],
      },
    },
  ],
  activeSpaceId: '',
  activeChannel: { type: 'text', name: 'general' },
  messagesByChannel: {},
  typingTimeout: null,
};

function parseTwemoji(root = document.body) {
  if (!window.twemoji) return;
  window.twemoji.parse(root, {
    folder: 'svg',
    ext: '.svg',
    className: 'twemoji',
  });
}

function makeJWT(username) {
  const payload = btoa(
    JSON.stringify({ user: username, iat: Date.now(), app: 'speakset' })
  );
  return `speakset.${payload}.signature`;
}

function seedMessages() {
  const key = 'text:general';
  if (!state.messagesByChannel[key]) {
    state.messagesByChannel[key] = [
      {
        id: crypto.randomUUID(),
        author: 'alex',
        text: 'Welcome to Speakset 👋',
        at: new Date(),
        reactions: {},
      },
      {
        id: crypto.randomUUID(),
        author: 'rhea',
        text: 'Clean. Fast. Private. nailed it. 🔥',
        at: new Date(),
        reactions: { '🔥': 2 },
      },
    ];
  }
}

function getActiveSpace() {
  return state.spaces.find((space) => space.id === state.activeSpaceId);
}

function getChannelKey() {
  return `${state.activeChannel.type}:${state.activeChannel.name}`;
}

function getAvatarText(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function renderSpaces() {
  spaceList.innerHTML = '';
  state.spaces.forEach((space) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = `space-btn ${space.id === state.activeSpaceId ? 'active' : ''}`;
    button.textContent = space.name;
    button.onclick = () => {
      state.activeSpaceId = space.id;
      state.activeChannel = { type: 'text', name: space.channels.text[0] };
      renderAll();
    };
    li.appendChild(button);
    spaceList.appendChild(li);
  });
}

function renderChannels() {
  const activeSpace = getActiveSpace();
  spaceName.textContent = activeSpace.name;
  inviteLink.textContent = `Invite: ${activeSpace.invite}`;
  userRole.textContent = activeSpace.role;

  function buildList(root, type, channels) {
    root.innerHTML = '';
    channels.forEach((channel) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      const isActive =
        state.activeChannel.type === type && state.activeChannel.name === channel;
      button.className = `channel-btn ${isActive ? 'active' : ''}`;
      button.textContent = type === 'private' ? `🔒 ${channel}` : `# ${channel}`;
      button.onclick = () => {
        state.activeChannel = { type, name: channel };
        renderMessages();
        renderChannels();
      };
      li.appendChild(button);
      root.appendChild(li);
    });
  }

  buildList(textChannels, 'text', activeSpace.channels.text);
  buildList(privateChannels, 'private', activeSpace.channels.private);
  parseTwemoji(document.querySelector('.channel-groups'));
}

function renderMessages() {
  const key = getChannelKey();
  const messages = state.messagesByChannel[key] || [];
  channelName.textContent = `${
    state.activeChannel.type === 'private' ? '🔒' : '#'
  } ${state.activeChannel.name}`;
  messageList.innerHTML = '';

  messages.forEach((msg) => {
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.message-item');
    const avatar = clone.querySelector('.avatar');
    const author = clone.querySelector('strong');
    const time = clone.querySelector('span');
    const text = clone.querySelector('.message-text');
    const reactions = clone.querySelector('.reactions');

    item.dataset.id = msg.id;
    avatar.textContent = getAvatarText(msg.author);
    author.textContent = msg.author;
    time.textContent = `Today ${new Date(msg.at).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
    text.textContent = msg.text;

    Object.entries(msg.reactions).forEach(([emoji, count]) => {
      const chip = document.createElement('span');
      chip.className = 'reaction-chip';
      chip.textContent = `${emoji} ${count}`;
      reactions.appendChild(chip);
    });

    clone.querySelectorAll('.message-actions button').forEach((btn) => {
      btn.onclick = () => handleMessageAction(msg.id, btn.dataset.action);
    });

    messageList.appendChild(clone);
  });

  parseTwemoji(messageList);
  parseTwemoji(document.querySelector('.chat-header'));
}

function handleMessageAction(messageId, action) {
  const key = getChannelKey();
  const messages = state.messagesByChannel[key] || [];
  const index = messages.findIndex((message) => message.id === messageId);
  if (index < 0) return;

  if (action === 'delete') {
    messages.splice(index, 1);
  }

  if (action === 'edit') {
    const edited = prompt('Edit message:', messages[index].text);
    if (edited && edited.trim()) {
      messages[index].text = edited.trim();
    }
  }

  if (action === 'react') {
    const emoji = prompt('React with emoji:', '🔥') || '🔥';
    messages[index].reactions[emoji] = (messages[index].reactions[emoji] || 0) + 1;
  }

  renderMessages();
}

function renderAll() {
  renderSpaces();
  renderChannels();
  renderMessages();
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) return;

  state.jwt = makeJWT(username);
  state.user = {
    username,
    avatarName: avatarInput.files[0]?.name || '',
  };

  authMeta.textContent = `JWT issued for ${username}: ${state.jwt.slice(0, 36)}...`;

  setTimeout(() => {
    authScreen.classList.add('hidden');
    app.classList.remove('hidden');
    state.activeSpaceId = state.spaces[0].id;
    seedMessages();
    renderAll();
  }, 500);
});

createSpaceButton.addEventListener('click', () => {
  const name = prompt('Space name?');
  if (!name || !name.trim()) return;
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const space = {
    id: crypto.randomUUID(),
    name: name.trim(),
    role: 'Owner',
    invite: `speakset.gg/${slug}`,
    channels: {
      text: ['general'],
      private: ['staff-only'],
    },
  };
  state.spaces.unshift(space);
  state.activeSpaceId = space.id;
  state.activeChannel = { type: 'text', name: 'general' };
  renderAll();
});

messageInput.addEventListener('input', () => {
  if (!state.user) return;
  typingIndicator.textContent = `${state.user.username} is typing...`;
  clearTimeout(state.typingTimeout);
  state.typingTimeout = setTimeout(() => {
    typingIndicator.textContent = '';
  }, 900);
});

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!state.user) return;

  const text = messageInput.value.trim();
  if (!text) return;

  const key = getChannelKey();
  state.messagesByChannel[key] = state.messagesByChannel[key] || [];
  state.messagesByChannel[key].push({
    id: crypto.randomUUID(),
    author: state.user.username,
    text,
    at: new Date(),
    reactions: {},
  });

  typingIndicator.textContent = '';
  messageInput.value = '';
  renderMessages();
  messageList.scrollTop = messageList.scrollHeight;
});

parseTwemoji();
