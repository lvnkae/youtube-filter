/*!
 *  @brief  Youtubeチャンネルリンクから主を切り出すpattern
 *  @retval ret[1] '@'          / ret[0] handle
 *  @retval ret[1] 'c/'         / ret[2] custom-channel
 *  @retval ret[1] 'user/'      / ret[2] username
 *  @retval ret[1] 'channel/'   / ret[2] channel-id
 */
const AUTHOR_EXTRACTOR = /(@|user\/|channel\/|c\/)([^/?#]+)/;
//
const XML_CHANNEL_NAME_EXTRACTOR = /\<name\>([^"]+)\<\/name\>/;
const XML_CHANNEL_ID_EXTRACTOR = /\<yt:channelId\>(UC[a-zA-Z0-9_-]{22})\<\/yt:channelId\>/;
//
const CHANNEL_NAME_EXTRACTOR = /"pageTitle":"([^"]+)"/;
const CHANNEL_ID_EXTRACTOR = /"(?:channelId|browseId)":"(UC[a-zA-Z0-9_-]{22})"/;

class BGParser {

    static parse_json(json) {
        const author_url = json.author_url;
        let ret = { result: false,
                    name:json.author_name};
        if (author_url == null) {
            return ret;
        }
        const author = author_url.match(AUTHOR_EXTRACTOR)
        if (author == null) {
            return ret;
        }
        if (author[1] === "channel/") {
            ret.id = author[2];
        }
        ret.author = `${author[1]}${author[2]}`;
        ret.result = true;
        return ret;
    }

    static parse_feeds_xml(xml) {
        const name_match = xml.match(XML_CHANNEL_NAME_EXTRACTOR);
        const id_match = xml.match(XML_CHANNEL_ID_EXTRACTOR);
        return { 
            name: (name_match != null) ?name_match[1] :'',
            id: (id_match != null) ?id_match[1] :null
        };
    }

    static parse_searched_video_html(video_id, html) {
        let ret = { success:false };
        //
        const video_test = new RegExp(`videoRenderer":{"videoId":"${video_id}"`, 'g');
        if (!video_test.test(html)) {
            return ret;
        }
        const owner_test = /"ownerText":{/g;
        owner_test.lastIndex = video_test.lastIndex;
        if (!owner_test.test(html)) {
            return ret;
        }
        //
        const channel_match = /"text":"([^"]+)"/g;
        channel_match.lastIndex = owner_test.lastIndex;
        const match_channel = channel_match.exec(html);
        if (match_channel == null) {
            return ret;
        }
        ret.name = match_channel[1];
        //
        const channel_id_match = /browseId":"(UC[a-zA-Z0-9_-]{22})"/g;
        channel_id_match.lastIndex = owner_test.lastIndex;
        const match_channel_id = channel_id_match.exec(html);
        if (match_channel_id == null) {
            return ret;
        }
        ret.id = match_channel_id[1];
        //
        const author_match = /canonicalBaseUrl":"\/(@|user\/|channel\/|c\/)([^"]+)"/g;
        author_match.lastIndex = owner_test.lastIndex;
        const match_author = author_match.exec(html);
        if (match_author == null) {
            return ret;
        }
        ret.author = `${match_author[1]}${match_author[2]}`;
        //
        ret.success = true;
        return ret;
    }

    static parse_channel_html(html) {
        const name_match = html.match(CHANNEL_NAME_EXTRACTOR);
        const id_match = html.match(CHANNEL_ID_EXTRACTOR);
        return { 
            name: (name_match != null) ?name_match[1] :'',
            id: (id_match != null) ?id_match[1] :null
        };
    }

    static parse_searched_playlist_html(list_id, html) {
        let ret = { success:false };
        //
        const playlist_test = new RegExp(`"playlistId":"${list_id}"`, 'g');
        // 検索結果からlist(lockup_view_model)を抽出
        const lockup_vm_test = /lockupMetadataViewModel":{/g;
        let lockup_vm_inx = [];
        let i = 0;
        while (lockup_vm_test.test(html)) {
            if (i > 0) {
                lockup_vm_inx[i-1].last = lockup_vm_test.lastIndex;
            }
            lockup_vm_inx.push({index:i, first:lockup_vm_test.lastIndex, last:-1});
            i++;
        }
        let target = -1;
        for (const inx of lockup_vm_inx) {
            playlist_test.lastIndex = inx.first;
            if (playlist_test.test(html)) {
                if (inx.last == -1 || playlist.lastIndex < ins.last) {
                    target = inx.index;
                    break;
                }
            }
        }
        if (target < 0) {
            return ret;
        }
        //
        const search_limit = lockup_vm_inx[target].last; // 検索範囲終端
        //
        const metadata_test = /"metadataParts":\[/g;
        metadata_test.lastIndex = lockup_vm_inx[target].first;
        if (!metadata_test.test(html)) {
            return ret;
        }
        if (search_limit != -1 && metadata_test.lastIndex > search_limit) {
            return ret;
        }
        //
        const channel_match = /"content":"([^"]+)"/g;
        channel_match.lastIndex = metadata_test.lastIndex;
        const match_channel = channel_match.exec(html);
        if (match_channel == null ||
            (search_limit != -1 && match_channel.lastIndex > search_limit)) {
            return ret;
        }
        ret.name = match_channel[1];
        //
        const channel_id_match = /browseId":"(UC[a-zA-Z0-9_-]{22})"/g;
        channel_id_match.lastIndex = metadata_test.lastIndex;
        const match_channel_id = channel_id_match.exec(html);
        if (match_channel_id == null ||
            (search_limit != -1 && match_channel_id.lastIndex > search_limit)) {
            return ret;
        }
        ret.id = match_channel_id[1];
        //
        const author_match = /canonicalBaseUrl":"\/(@|user\/|channel\/|c\/)([^"]+)"/g;
        author_match.lastIndex = metadata_test.lastIndex;
        const match_author = author_match.exec(html);
        if (match_author == null ||
            (search_limit != -1 && match_channel_id.lastIndex > search_limit)) {
            return ret;
        }
        ret.author = `${match_author[1]}${match_author[2]}`;
        //
        ret.success = true;
        return ret;
    }
};