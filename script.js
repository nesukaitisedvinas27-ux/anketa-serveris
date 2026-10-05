const profileNote = document.getElementById('profileNote');
const shareButton = document.getElementById('shareButton');
const yearElement = document.getElementById('year');
const discordStatus = document.getElementById('discordStatus');
const discordStatusText = document.getElementById('discordStatusText');
const activityLabel = document.getElementById('activityLabel');
const activityName = document.getElementById('activityName');
const activityDetails = document.getElementById('activityDetails');
const activityIcon = document.getElementById('activityIcon');
const presenceHelp = document.getElementById('presenceHelp');
const discordUserId = '1129084313544175677';
let noticeTimer;

if (yearElement) yearElement.textContent = new Date().getFullYear();

document.querySelectorAll('.avatar-photo, .link-thumbnail img').forEach((image) => {
    image.addEventListener('error', () => {
        image.hidden = true;
    });
});

function showNotice(message) {
    profileNote.textContent = message;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
        profileNote.textContent = '';
    }, 2500);
}

async function copyText(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showNotice(successMessage);
    } catch {
        showNotice('Nepavyko nukopijuoti. Pabandyk dar kartą.');
    }
}

shareButton.addEventListener('click', async () => {
    if (navigator.share) {
        try {
            await navigator.share({ title: document.title, url: window.location.href });
        } catch (error) {
            if (error.name !== 'AbortError') showNotice('Nepavyko bendrinti profilio.');
        }
        return;
    }
    await copyText(window.location.href, 'Profilio nuoroda nukopijuota.');
});

const discordStatusLabels = {
    online: 'Prisijungęs',
    idle: 'Neaktyvus',
    dnd: 'Netrukdyti',
    offline: 'Atsijungęs'
};

function setPresenceUnavailable(message, details = 'Prisijunk prie Lanyard Discord serverio, kad būsena būtų matoma.') {
    discordStatus.dataset.status = 'unavailable';
    discordStatusText.textContent = 'Dar neprijungta';
    activityLabel.textContent = 'VEIKLA';
    activityName.textContent = message;
    activityDetails.textContent = details;
    activityIcon.textContent = 'i';
    presenceHelp.hidden = false;
}

function renderPresence(data) {
    presenceHelp.hidden = true;
    const status = discordStatusLabels[data.discord_status] ? data.discord_status : 'offline';
    discordStatus.dataset.status = status;
    discordStatusText.textContent = discordStatusLabels[status];

    const activities = Array.isArray(data.activities) ? data.activities : [];
    const activity = status === 'offline' ? null : activities.find((entry) => {
        const name = (entry.name || '').toLowerCase();
        const musicApps = ['spotify', 'apple music', 'youtube music', 'soundcloud', 'tidal', 'deezer', 'amazon music'];
        return entry.type !== 2 && entry.type !== 4 && !musicApps.some((app) => name.includes(app));
    });

    if (!activity) {
        activityLabel.textContent = 'VEIKLA';
        activityName.textContent = status === 'offline' ? 'Šiuo metu atsijungęs' : 'Jokios viešos veiklos';
        activityDetails.textContent = status === 'offline' ? 'Veikla bus rodoma jam prisijungus.' : 'Šiuo metu nieko nerodo.';
        activityIcon.textContent = '—';
        return;
    }

    const activityVerbs = {
        0: 'Žaidžia',
        1: 'Transliuoja',
        3: 'Žiūri',
        5: 'Varžosi'
    };
    const verb = activityVerbs[activity.type] || 'Veikia';
    activityLabel.textContent = 'DABAR VEIKIA';
    activityName.textContent = `${verb} ${activity.name || 'Discord veiklą'}`;
    activityDetails.textContent = activity.details || activity.state || 'Discord veikla';
    activityIcon.textContent = (activity.name || '▶').slice(0, 1).toUpperCase();
}

async function updateDiscordPresence() {
    if (document.hidden) return;

    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success || !result.data) {
            setPresenceUnavailable('Discord būsena dar nesusieta');
            return;
        }
        renderPresence(result.data);
    } catch {
        setPresenceUnavailable('Ryšys su Lanyard nepavyko', 'Bus bandoma vėl automatiškai.');
    }
}

updateDiscordPresence();
window.setInterval(updateDiscordPresence, 30000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateDiscordPresence();
});
