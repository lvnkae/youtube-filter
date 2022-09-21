/*!
 *  @brief  message送信クラス(background側)
 *  @note   継承して使う
 */
class BGMessageSender {
    //
    constructor(httpreq_pallarel = 8) {
        this.connected_tab = [];
        //
        this.delay_send_timer = null;
        this.delay_message = [];
        this.my_request = [];
        //
        this.reply_queue = {full: false, queue: []};
        this.wait_queue = [];
        this.http_request_timer = null;
        //
        this.MAX_HTTPREQUEST_PALLAREL = httpreq_pallarel;
    }

    /*!
     *  @brief  タブ登録
     *  @param  tab_id          タブID
     *  @note   返信は登録されたタブにのみ行う
     */
    entry(tab_id) {
        this.connected_tab[tab_id] = null;
    }
    /*!
     *  @brief  登録されたタブか
     */
    is_connected_tab(tab_id) {
        return tab_id in this.connected_tab;
    }

    /*!
     *  @brief  返信
     *  @param  message     メッセージ
     *  @param  tab_ids     返信対象タブID群
     *  @param  b_active    アクティブなタブにのみ送るか？
     *  @note   登録されているタブにのみ送信
     */
    send_reply(message, tab_ids, b_active) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                if (tab.id in this.connected_tab) {
                    if (b_active && !tab.active) {
                        continue;
                    }
                    if (tab_ids) {
                        if (tab.id in tab_ids) {
                        } else {
                            continue;
                        }
                    }
                    // note
                    // responseを設定するとerror
                    //   "The message port closed before a response was received."
                    // → 応答不要なのでnullにしておく
                    message.tab_active = tab.active;
                    chrome.tabs.sendMessage(tab.id, message, null); 
                }
            }
        });
    }

    /*!
     *  @brief  遅延返信
     *  @note   content_scriptsメッセージ受信処理の途中で返信するのは気持ち悪い。
     *  @note   理想は受信関数を抜けたタイミングでの返信だが、関数終了eventは見当
     *  @note   たらず、Listner登録関数からPromiseを返す手法もうまくいかない。
     *  @note   原始的な手法(Timer)に頼る…
     */
    send_reply_delay(message) {
        if (this.delay_send_timer == null) {
            this.delay_send_timer = setTimeout(()=> {
                for (const msg of this.delay_message) {
                    this.send_reply(msg);
                }
                clearTimeout(this.delay_send_timer);
                this.delay_send_timer = null;
                this.delay_message = [];
            });
        }
        this.delay_message.push(message);
    }

    is_owned_request(requestId) {
        return requestId in this.my_request;
    }
    hold_request(requestId) {
        this.my_request[requestId] = null;
    }
    release_request(requestId) {
        delete this.my_request[requestId];
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
     *  @brief  queue登録用obj生成
     *  @param  fparam  フリーパラメータ
     *  @param  tab_id  送信者tab_id(=返信先)
     */
    static create_queue_obj(fparam, tab_id) {
        var q = {tab_ids: []};
        q.tab_ids[tab_id] = fparam;
        return q;
    }

    /*!
     *  @brief  queueからフリーパラメータを得る
     *  @param  q       queue登録用obj
     */
    static get_queue_freeparam(q) {
        for (const q_key in q.tab_ids) {
            return q.tab_ids[q_key];
        }
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
     *  @brief  http_request発行待ちキューに詰み直す
     *  @param  key     登録キー
     *  @param  q       queue登録用obj
     *  @note   リトライ用
     */
    reentry_wait_queue(key, q) {
        var cq = {tab_ids: []};
        cq.tab_ids = Object.create(q.tab_ids);
        this.entry_wait_queue(key, cq);
    }

    /*!
     *  @brief  http_requestを発行して良いか
     *  @param  key     登録キー
     *  @param  fparam  フリーパラメータ
     *  @param  tab_id  送信者tab_id(=返信先)
     *  @retval true    発行してよし
     */
    can_http_request(key, fparam, tab_id) {
        // 既にキューに積まれてるか
        if (key in this.reply_queue.queue) {
            // 応答待ちキューに積まれてる
            this.reply_queue.queue[key].tab_ids[tab_id] = fparam;
            return false;
        }
        for (var queue of this.wait_queue) {
            if (key in queue.queue) {
                // 発行待ちキューに積まれてる
                this.queue.queue[key].tab_ids[tab_id] = fparam;
                return false;
            }
        }
        const q = BGMessageSender.create_queue_obj(fparam, tab_id);
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
                http_request_func(key, BGMessageSender.get_queue_freeparam(q));
            }
            clearTimeout(this.http_request_timer);
            this.http_request_timer = null;
        }, 200); /* ウェイト入れてみる*/
    }
 }
