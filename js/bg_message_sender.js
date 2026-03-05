/*!
 *  @brief  message送信クラス(background側)
 *  @note   継承して使う
 */
class BGMessageSender {
    //
    constructor(httpreq_pallarel = 8) {
        this.reply_queue = {full: false, queue: []};
        this.wait_queue = [];
        this.http_request_timer = null;
        //
        this.MAX_HTTPREQUEST_PALLAREL = httpreq_pallarel;
    }

    /*!
     *  @brief  返信
     *  @param  message     メッセージ
     *  @param  tab_ids     返信対象タブID群
     *  @param  b_active    アクティブなタブにのみ送るか？
     *  @note   登録されているタブにのみ送信
     */
    static send_reply(message, tab_ids, b_active) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                if (b_active && !tab.active) {
                    continue;
                }
                if (tab_ids) {
                    if (!tab_ids.has(tab.id)) {
                        continue;
                    }
                }
                // note
                // responseを設定するとerror
                //   "The message port closed before a response was received."
                // → 応答不要なのでnullにしておく
                message.tab_active = tab.active;
                chrome.tabs.sendMessage(tab.id, message, null).catch((error)=>{
                    // manifestV3ではsendMessageが返すpromiseを無視するとerrorが出る
                    //  Uncaught (in promise) Error: Could not establish connection. 
                    //  Receiving end does not exist.
                });
            }
        });
    }

    static create_video_ids(video_id) {
        if (video_id == null) {
            return null;
        } else {
            const video_ids = new Set();
            video_ids.add(video_id);
            return video_ids;
        }
    }
    static set_video_id(q, video_id) {
        if (video_id == null) {
            return;
        }
        if (q.video_ids == null) {
            q.video_ids = BGMessageSender.create_video_ids(video_id);
        } else {
            q.video_ids.add(video_id);
        }
    }
    static conv_video_ids(video_ids) {
        if (video_ids == null) {
            return null;
        }
        return [...video_ids];
    }

    /*!
     *  @brief  全てのキューが空か
     */
    is_empty_of_all_queue() {
        return Object.keys(this.reply_queue.queue).length == 0 &&
               this.wait_queue.length == 0;
    }

    /*!
     *  @brief  応答待ちキューを得る
     *  @param  key 登録キー
     */
    get_reply_queue(key) {
        return this.reply_queue.queue[key];
    }
    /*!
     *  @brief  応答待ちキューに送信済みマークを入れる
     *  @param  key 登録キー
     */
    mark_reply_queue(key) {
        return this.reply_queue.queue[key].send = true;
    }
    /*!
     *  @brief  応答待ちキューから削除
     *  @param  key 登録キー
     */
    remove_reply_queue(key) {
        delete this.reply_queue.queue[key];
    }

    /*!
     *  @brief  発行待ちキューを得る
     *  @param  key 登録キー
     */
    get_wait_queue(key) {
        for (const queue of this.wait_queue) {
            if (key in queue.queue) {
                return queue.queue[key];
            }
        }
        return null;
    }


    /*!
     *  @brief  tab_id群生成
     *  @param  tab_id  送信者tab_id(=返信先)
     */
    static create_blank_tab_ids() {
        return new Set();
    }
    static create_tab_ids(tab_id) {
        let tab_ids = BGMessageSender.create_blank_tab_ids();
        tab_ids.add(tab_id);
        return tab_ids;    
    }
    /*!
     *  @brief  queue登録用obj生成
     *  @param  tab_id  送信者tab_id(=返信先)
     */
    static create_blank_queue_obj() {
        const q = {tab_ids: BGMessageSender.create_blank_tab_ids()};
        return q;
    }
    static create_queue_obj(tab_id) {
        let q = BGMessageSender.create_blank_queue_obj();
        q.tab_ids.add(tab_id);
        return q;
    }

    /*!
     *  @brief  queueにkeyを登録する
     *  @param[dst] queue   登録先
     *  @param[in]  key     登録キー
     *  @param[in]  q       queue登録用obj
     *  @retval 登録成功
     */
    static entry_queue(queue, key, q, max_queue) {
        if (queue.full) {
            return false;
        }
        //const MAX_HTTPREQUEST_PALLAREL = 8;
        queue.queue[key] = q;
        if (Object.keys(queue.queue).length == max_queue) {
            queue.full = true;
        }
        return true;
    }

    /*!
     *  @brief  http_request発行待ちキューに積む
     *  @param  key     登録キー
     *  @param  q       queue登録用obj
     */
    entry_wait_queue(key, q) {
        for (var inx = 0; inx < this.wait_queue.length; inx++) {
            if (BGMessageSender.entry_queue(this.wait_queue[inx], key, q, this.MAX_HTTPREQUEST_PALLAREL)) {
                return;
            }
        }
        var obj = {full: false, queue: []};
        obj.queue[key] = q;
        if (this.MAX_HTTPREQUEST_PALLAREL == 1) {
            obj.full = true;
        }
        this.wait_queue.push(obj);
    }

    /*!
     *  @brief  http_requestを発行して良いか
     *  @param  key     登録キー
     *  @param  tab_id  送信者tab_id(=返信先)
     *  @retval true    発行してよし
     */
    can_http_request(key, tab_id) {
        // 既にキューに積まれてるか
        if (key in this.reply_queue.queue) {
            // 応答待ちキューに積まれてる
            this.reply_queue.queue[key].tab_ids.add(tab_id);
            return false;
        }
        for (var queue of this.wait_queue) {
            if (key in queue.queue) {
                // 発行待ちキューに積まれてる
                queue.queue[key].tab_ids.add(tab_id);
                return false;
            }
        }
        const q = BGMessageSender.create_queue_obj(tab_id);
        // 即時request可？
        if (BGMessageSender.entry_queue(this.reply_queue, key, q, this.MAX_HTTPREQUEST_PALLAREL)) {
            return true;
        }
        //
        this.entry_wait_queue(key, q);
        return false;
    }
    can_http_request2(key, tab_ids) {
        // 既にキューに積まれてるか
        if (key in this.reply_queue.queue) {
            // 応答待ちキューに積まれてる
            const queue = this.reply_queue.queue[key];
            tab_ids.forEach(id=>{
                queue.tab_ids.add(id);
            });
            return false;
        }
        for (var queue of this.wait_queue) {
            if (key in queue.queue) {
                // 発行待ちキューに積まれてる
                const wqueue = queue.queue[key];
                tab_ids.forEach(id=>{
                    wqueue.tab_ids.add(id);
                });
                    return false;
            }
        }
        const q = BGMessageSender.create_blank_queue_obj();
        tab_ids.forEach(id=> {
            q.tab_ids.add(id);
        });
        // 即時request可？
        if (BGMessageSender.entry_queue(this.reply_queue, key, q, this.MAX_HTTPREQUEST_PALLAREL)) {
            return true;
        }
        //
        this.entry_wait_queue(key, q);
        return false;
    }

    /*!
     *  @brief  応答待ちキュー更新
     *  @param  key                 登録キー
     *  @param  http_request_func   http_request発行関数
     */
    update_reply_queue(key, http_request_func) {
        this.remove_reply_queue(key);
        if (Object.keys(this.reply_queue.queue).length > 0) {
            return;
        } else {
            if (this.wait_queue.length == 0) {
                this.reply_queue.full = false;
                return;
            }
        }
        // 応答待ちキューが空になったら待機キュー先頭を昇格する
        this.reply_queue = this.wait_queue[0];
        const prev_wait_queue = this.wait_queue;
        this.wait_queue = [];
        for (var inx = 1; inx < prev_wait_queue.length; inx++) {
            this.wait_queue.push(prev_wait_queue[inx]);
        }
        // http_request発射
        if (this.http_request_timer != null) {
            return;
        }
        this.http_request_timer = setTimeout(()=> {
            for (const key in this.reply_queue.queue) {
                const q = this.reply_queue.queue[key];
                if (q.send) {
                    continue;
                }
                http_request_func(key);
            }
            clearTimeout(this.http_request_timer);
            this.http_request_timer = null;
        }, 200); /* ウェイト入れてみる*/
    }
 }
