const StockVideo = (tab) => {
    console.log(tab);
    // find video tag
    console.log("call: executeScript.");
    chrome.tabs.executeScript(
        {
            allFrames: true,
            code: `
                vs = document.getElementsByTagName("video");
                for(v of vs){
                    if(v.currentSrc !== ''){
                        v.currentTime;
                        break;
                    }
                }
            `
        },
        (result) => {
            console.log("back: executeScript.", result);
            // The result is array, having returns of each flame.
            // If flames don't contain valid video tag, the return value is null.
            for (const value of result) {
                if (value !== null) {
                    console.log("call: local storage get videos");
                    chrome.storage.local.get(
                        ['videos'],
                        (result) => {
                            console.log("back: local storage get videos", result);
                            const newVideos = result.videos;
                            newVideos.push({
                                timeStamp: Date.now(),
                                url: tab.url,
                                title: tab.title,
                                currentTime: value,
                                f: tab.favIconUrl
                            });

                            console.log("call: local storage set videos");
                            chrome.storage.local.set(
                                { videos: newVideos },
                                () => {
                                    console.log("back: local storage set videos");
                                    chrome.browserAction.setBadgeText({ text: String(newVideos.length) });
                                    chrome.tabs.remove(tab.id);
                                }
                            );
                        }
                    );
                    break;
                }
            }
        }
    );
};

const deleteAll = (tab) => {
    if (!confirm(chrome.i18n.getMessage("delete_all_msg")))
        return;
    chrome.storage.local.set({ videos: new Array() });
    chrome.browserAction.setBadgeText({ text: "" });
}

const contextMenuTable = {
    stockVideo: {
        prop: { id: "stockVideo", title: chrome.i18n.getMessage("stock_video"), contexts: ["all"] },
        func: StockVideo
    },
    deleteAll: {
        prop: { id: "deleteAll", title: chrome.i18n.getMessage("delete_all"), contexts: ["browser_action"] },
        func: deleteAll
    }
};

chrome.runtime.onInstalled.addListener((details) => {
    // Style badge
    const badgeBackgroundColor = { color: "#360" };
    chrome.browserAction.setBadgeBackgroundColor(badgeBackgroundColor);

    // Initialize storage
    chrome.storage.local.set({ videos: new Array() });

    // Create contextMenus
    for (const item in contextMenuTable)
        chrome.contextMenus.create(contextMenuTable[item].prop);

});
// Add Listener to contextMenus
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("some contextMenu clicked.", info, tab);

    for (const item in contextMenuTable) {
        if (info.menuItemId === contextMenuTable[item].prop.id) {
            contextMenuTable[item].func(tab);
            break;
        }
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        chrome.tabs.create(
            { url: request.videoUrl, active: true },
            (tab) => {
                (function resume(cnt) {
                    function execResume(callbackForScript) {
                        setTimeout(() => {
                            chrome.tabs.executeScript(
                                tab.id,
                                {
                                    allFrames: true,
                                    code: `
                                        vs = document.getElementsByTagName("video");
                                        if (vs[0].currentTime < ${request.currentTime})
                                            vs[0].currentTime = ${request.currentTime};
                                        vs[0].currentTime;
                                    `
                                },
                                callbackForScript
                            );
                        }, 1500);
                    };

                    execResume(result => {
                        console.log(result);
                        if (cnt <= 0) {
                            // execute, one more time!
                            execResume(null);
                            return;
                        }
                        cnt--;
                        if (result.every(i => i == null))
                            resume(cnt);
                        else {
                            // execute, "two" more times!
                            resume(0);
                        }
                    });
                })(40);
            }
        )
    }
);

chrome.commands.onCommand.addListener(function (command, tab) {
    console.log('Command:', command);
    StockVideo(tab);
});