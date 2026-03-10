// video-id:11byte author:50byte json-overhead:20byte -> 81byte
// author:50byte channel-name:50byte channel-id:24byte json-overhead:20byte ->144byte
const SIZE_AUTHOR = 81;
const SIZE_NAMEID = 144;
const SIZE_REQUIRING_PRUNE = 7*1024*1024;
class BGSessionAccessor {
    /*!
     *  @brief  authorでチャンネル情報を得る
     */
    author_to_channel_info(author) {
        const channel_info = this.channel_info_nameid.get(author);
        if (channel_info != null) {
            return {
                author: author,
                name: channel_info.name,
                id: channel_info.id
            };
        } else {
            return null;
        }
    }
    /*!
     *  @brief  動画IDでauthorを得る
     */
    video_id_to_author(video_id) {
        return this.channel_info_author.get(video_id);
    }

    /*!
     *  @brief  動画IDをkeyとしたauthor登録
     */
    set_channel_author(video_id, author) {
        this.channel_info_author.set(video_id, author);
        this.num_video_id_keys++;
        this.prune();
    }
    /*!
     *  @brief  author_urlをkeyとしたチャンネル情報登録
     */
    set_channel_info(author, channel_info) {
        this.channel_info_nameid.set(author, {name: channel_info.name,
                                              id:channel_info.id});
        this.num_author_keys++;                                              
        this.prune();
    }

    async prune() {
        const estimated_size = this.num_author_keys*SIZE_NAMEID
                             + this.num_video_id_keys*SIZE_AUTHOR;
        if (estimated_size < SIZE_REQUIRING_PRUNE) {
            return;
        }
        const video_id_keys = Object.keys(this.channel_info_author);
        const author_keys = Object.keys(this.channel_info_nameid);
        const num_delete_vkeys = Math.floor(video_id_keys.length * 0.3);
        const num_delete_akeys = Math.floor(author_keys.length * 0.3);
        const delete_vkeys = video_id_keys.slice(0, num_delete_vkeys);
        const delete_akeys = author_keys.slice(0, num_delete_akeys);
        for (const key of delete_vkeys) {
            this.channel_info_author.delete(key);
        }
        for (const key of delete_akeys) {
            this.channel_info_nameid.delete(key);
        }
        this.num_video_id_keys = delete_vkeys.length - num_delete_vkeys;
        this.num_author_keys = delete_akeys.length - num_delete_akeys;
    }

    constructor() {
        this.num_video_id_keys = 0;
        this.num_author_keys = 0;
        this.channel_info_author = new Map();
        this.channel_info_nameid = new Map();
    }
};
