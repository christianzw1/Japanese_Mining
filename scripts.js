document.getElementById('videoInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const videoTitle = document.getElementById('videoTitle');

    if (file) {
        const fileURL = URL.createObjectURL(file);
        const fileType = file.type || 'video/webm'; // Fallback para video/webm

        videoSource.src = fileURL;
        videoSource.type = fileType; // define o tipo MIME automaticamente
        videoPlayer.load();
        videoTitle.textContent = file.name;
    }
});

document.getElementById('subtitleInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        loadSubtitles(text);
        addCustomSubtitles(text);
    };

    reader.readAsText(file);
});

function loadSubtitles(srtText) {
    const subtitleList = document.getElementById('subtitleList');
    subtitleList.innerHTML = '';

    const lines = srtText.split('\n');
    let subtitle = {};
    lines.forEach((line) => {
        const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (timeMatch) {
            if (subtitle.text) {
                addSubtitleToList(subtitle);
                subtitle = {};
            }
            subtitle.time = line;
            subtitle.startTime = convertTimeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
            subtitle.endTime = convertTimeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
        } else if (line.trim() !== '' && !line.match(/^\d+$/)) {
            subtitle.text = (subtitle.text ? subtitle.text + ' ' : '') + line.trim();
        }
    });
    if (subtitle.text) {
        addSubtitleToList(subtitle);
    }
}

function addSubtitleToList(subtitle) {
    const subtitleItem = document.createElement('div');
    subtitleItem.className = 'subtitle-item';
    subtitleItem.dataset.startTime = subtitle.startTime;
    subtitleItem.dataset.endTime = subtitle.endTime;

    const textSpan = document.createElement('span');
    textSpan.textContent = subtitle.text;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', function(event) {
        event.stopPropagation();
        navigator.clipboard.writeText(subtitle.text).then(() => {
            alert('Subtitle copied to clipboard');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    });

    subtitleItem.appendChild(textSpan);
    subtitleItem.appendChild(copyButton);

    subtitleItem.addEventListener('click', function() {
        document.querySelectorAll('.subtitle-item').forEach(item => item.classList.remove('selected'));
        subtitleItem.classList.add('selected');
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.currentTime = subtitle.startTime;
        videoPlayer.play();
    });
    document.getElementById('subtitleList').appendChild(subtitleItem);
}

function addCustomSubtitles(srtText) {
    const videoPlayer = document.getElementById('videoPlayer');
    const customSubtitles = document.getElementById('customSubtitles');
    customSubtitles.innerHTML = '';

    const subtitles = parseSrt(srtText);
    let currentSubtitleIndex = -1;

    videoPlayer.ontimeupdate = function() {
        const currentTime = videoPlayer.currentTime;
        let subtitle = subtitles.find((sub, index) => {
            if (currentTime >= sub.startTime && currentTime <= sub.endTime) {
                currentSubtitleIndex = index;
                return true;
            }
            return false;
        });

        if (subtitle) {
            customSubtitles.innerText = subtitle.text;
            highlightCurrentSubtitle(subtitle.startTime, subtitle.endTime);
        } else {
            customSubtitles.innerText = '';
            removeHighlightFromSubtitles();
        }
    };
}

function parseSrt(srtText) {
    const lines = srtText.split('\n');
    const subtitles = [];
    let subtitle = {};

    lines.forEach((line) => {
        const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (timeMatch) {
            if (subtitle.text) {
                subtitles.push(subtitle);
                subtitle = {};
            }
            subtitle.startTime = convertTimeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
            subtitle.endTime = convertTimeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
        } else if (line.trim() !== '' && !line.match(/^\d+$/)) {
            subtitle.text = (subtitle.text ? subtitle.text + ' ' : '') + line.trim();
        }
    });
    if (subtitle.text) {
        subtitles.push(subtitle);
    }

    return subtitles;
}

function highlightCurrentSubtitle(startTime, endTime) {
    const subtitleList = document.getElementById('subtitleList');
    document.querySelectorAll('.subtitle-item').forEach(item => {
        const itemStartTime = parseFloat(item.dataset.startTime);
        const itemEndTime = parseFloat(item.dataset.endTime);

        if (itemStartTime === startTime && itemEndTime === endTime) {
            item.classList.add('current');
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            item.classList.remove('current');
        }
    });
}

function removeHighlightFromSubtitles() {
    document.querySelectorAll('.subtitle-item').forEach(item => {
        item.classList.remove('current');
    });
}

function convertTimeToSeconds(hours, minutes, seconds, milliseconds) {
    return (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds) + (parseInt(milliseconds) / 1000);
}
