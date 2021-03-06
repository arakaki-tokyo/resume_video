const StockVideo = (tab) => {
    // find video tag
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
            // The result is array, having returns of each flame.
            // If flames don't contain valid video tag, the return value is null.
            for (const value of result) {
                if (value !== null) {
                    chrome.storage.local.get(
                        ['videos'],
                        (result) => {
                            const newVideos = result.videos;
                            newVideos.push({
                                timeStamp: Date.now(),
                                url: tab.url,
                                title: tab.title,
                                currentTime: value,
                                f: tab.favIconUrl
                            });

                            chrome.storage.local.set(
                                { videos: newVideos },
                                () => {
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
                chrome.permissions.contains({ origins: ['<all_urls>'] }, result => {
                    if (result) {
                        (function resume(cnt) {
                            setTimeout(() => {
                                chrome.tabs.executeScript(
                                    tab.id,
                                    {
                                        allFrames: true,
                                        code: `
                                            vs = document.getElementsByTagName("video");
                                            for(v of vs){
                                                if (v != undefined && v.currentSrc != "" && v.currentTime < ${request.currentTime})
                                                    v.currentTime = ${request.currentTime};
                                            }
                                        `
                                    }
                                );
                                if (cnt > 0)
                                    resume(--cnt);
                            }, 1500);
                        })(40);
                    }
                });
            }
        );
    }
);

chrome.commands.onCommand.addListener(function (command, tab) {
    StockVideo(tab);
});