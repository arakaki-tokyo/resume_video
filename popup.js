const $ = (elm) => document.getElementById(elm);
class MyDate extends Date {
    strftime(fmt) {
        return fmt
            .replaceAll("%Y", String(this.getFullYear()))
            .replaceAll("%m", ('0' + (this.getMonth() + 1)).slice(-2))
            .replaceAll("%d", ('0' + this.getDate()).slice(-2))
            .replaceAll("%H", ('0' + this.getHours()).slice(-2))
            .replaceAll("%M", ('0' + this.getMinutes()).slice(-2))
            .replaceAll("%S", ('0' + this.getSeconds()).slice(-2));
    }
}

const videoListContainer = $("videoListContainer");
let videoList;

chrome.storage.local.get(
    'videos',
    (result) => {
        videoList = result.videos;
        console.log(videoListContainer);
        let content = "<ul>"

        for (const video of result.videos) {
            
            const iCurrentTime = parseInt(video.currentTime);
            const sCurrentTimeHour = String(Math.floor(iCurrentTime / 60)).padStart(2, "0");
            const sCurrentTimeMinutes = String(iCurrentTime % 60).padStart(2, "0");

            content += `
                <li>
                    <p class="timeStamp">&#x23EF;<b>${sCurrentTimeHour}:${sCurrentTimeMinutes}</b> (${new MyDate(video.timeStamp).strftime("%Y/%m/%d %H:%M")})</p>
                    <div class="linkContainer">
                        <a class="videoLink" href="${video.url}" title="${video.url}" timeStamp="${video.timeStamp}" currentTime="${video.currentTime}">
                            <img src="${video.f}">
                            ${video.title}
                        </a>
                        <button class="delete" timeStamp="${video.timeStamp}">&#x2716;</button>
                    </div>
                </li>`;

        }

        videoListContainer.innerHTML = content;

        Array.prototype.forEach.call(document.getElementsByClassName("videoLink"),v => {
            v.addEventListener("click", function(e){
                deleteVideo(e);
                chrome.runtime.sendMessage(
                    {
                        videoUrl: this.getAttribute("href"),
                        currentTime: this.getAttribute("currentTime"),
                    }
                );
            });
        });

        Array.prototype.forEach.call(document.getElementsByClassName("delete"),v => {
            v.addEventListener("click", function(e){
                this.closest("li").style.display = "none";
                deleteVideo(e);
            });
        });

    }
);

const deleteVideo = function (e) {
    const delIndex = videoList.findIndex(i => String(i.timeStamp) === e.target.getAttribute("timeStamp")); 
    videoList.splice(delIndex, 1);

    chrome.storage.local.set({videos: videoList}, () => {
        chrome.browserAction.setBadgeText({ text: (videoList.length==0?'':videoList.length.toString()) });
    });
};