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
    static async set_channel_author(video_id, author) {
        await chrome.storage.session.set({ [video_id]: { author: author } });
    }
    /*!
     *  @brief  author_urlをkeyとしたチャンネル情報登録
     */
    static async set_channel_info(author, channel_info) {
        await chrome.storage.session.set(
                { [author]:{ name: channel_info.name, id: channel_info.id } });
    }

};
