// video-id:11byte author:50byte json-overhead:20byte -> 81byte
// author:50byte channel-name:50byte channel-id:24byte json-overhead:20byte ->144byte
// video-id:author = 4:6くらいの想定
// 10keys -> v*4+a*6 -> 1188byte
// 8MB -> 1024*1024*8 -> 8,388,608byte -> 7062*10keys程度
// 全部authorだった場合を考慮(144*65535=9,437,040=約9MB)
const NUM_REQUIRING_PRUNE = 65535;
class BGSessionAccessor {
    /*!
     *  @brief  authorでチャンネル情報を得る
     */
    static async author_to_channel_info(author) {
        const channel_data = await chrome.storage.session.get(author);
        const channel_id = channel_data[author]?.id;
        if (channel_id != null) {
            return {
                author: author,
                name: channel_data[author]?.name,
                id: channel_id,
            };
        } else {
            return null;
        }
    }
    /*!
     *  @brief  動画IDでauthorを得る
     */
    static async video_id_to_author(video_id) {
        const author_data = await chrome.storage.session.get(video_id);
        return author_data[video_id]?.author;
    }

    /*!
     *  @brief  動画IDをkeyとしたauthor登録
     */
    async set_channel_author(video_id, author) {
        await chrome.storage.session.set({ [video_id]: { author: author } });
        this.prune();
    }
    /*!
     *  @brief  author_urlをkeyとしたチャンネル情報登録
     */
    async set_channel_info(author, channel_info) {
        await chrome.storage.session.set(
                { [author]:{ name: channel_info.name, id: channel_info.id } });
        this.prune();
    }

    async prune() {
        if (++this.num_keys < NUM_REQUIRING_PRUNE) {
            return;
        }
        const data = await chrome.storage.session.get(null);
        const keys = Object.keys(data);
        const num_delete_keys = Math.floor(keys.length * 0.3); // 3割消す
        const delete_keys = keys.slice(0, num_delete_keys);
        await chrome.storage.session.remove(delete_keys);
        this.num_keys = keys.length - num_delete_keys;
    }

    async initialize() {
        const data = await chrome.storage.session.get(null);
        this.num_keys = Object.keys(data).length;
    }

    constructor() {
        this.num_keys = 0;
        this.ready = this.initialize();
    }
};
