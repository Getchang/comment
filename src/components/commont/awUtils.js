// dom生成器策略
const domCreator = {
    'tItem': function(child) {
        const el = document.createElement('div');
        el.className = 'tItem';
        if(typeof child !== 'undefined') {
            el.appendChild(document.createTextNode(child || ''));
        }
        return el;
    },
    'eItem': function(val, style) {
        const frame = document.createDocumentFragment();
        const el = document.createElement('span');
        el.className = 'eItem';
        el.style.backgroundPosition = style;
        el.contentEditable = false;
        el.alt = val;
        frame.appendChild(el);
        const txt = document.createTextNode('');
        frame.appendChild(txt);
        return [frame, el, txt];
    },
    'lItem': function(val) {
        const frame = document.createDocumentFragment();
        const el = document.createElement('span');
        const txt = document.createTextNode('');
        el.className = 'lItem';
        el.contentEditable = false;
        el.innerHTML = `@${val.label}`;
        el.dataset.id = val.value;
        frame.appendChild(el);
        frame.appendChild(txt);
        return [frame, el, txt];
    }
};


export default class AwUtils {
    constructor(dom, options = {}) {
        this.select = null;
        this.lastNode = null;
        this.lastInsertNode = null;
        this.lastRange = null;
        this.el = null;
        this.isFocus = false;
        this.defaultHTML = '<div class="tItem"></div>';
        this.options = options;
        this.isFirefox = ~window.navigator.userAgent?.indexOf('Firefox');
        this.init(dom);
    }
    init(dom) {
        if(typeof dom === 'undefined') {
            throw new Error('comment must have a activity dom');
        }
        const el = typeof dom === 'string' ? document.querySelector(dom) : dom;
        this.el = el;
        // this.el.innerHTML = this.defaultHTML;
        this.initEventListen();
    }
    initEventListen() {
        if(!this.el) {
            throw new Error('init Listening error, can’t find container dom');
        }
        this.el.addEventListener('keypress', this.keyPressFun.bind(this));
        this.el.addEventListener('keydown', this.keydownFun.bind(this));
        this.el.addEventListener('keyup', this.keyupFun.bind(this));
        this.el.addEventListener('blur', this.blurFun.bind(this));
        this.el.addEventListener('focus', this.funFocus.bind(this));
        this.el.addEventListener('compositionend', this.compositionendFun.bind(this));
        this.el.addEventListener('compositionstart', this.compositionstartFun.bind(this));
        this.el.addEventListener('paste', this.pastetFun.bind(this));

        this.isFirefox && this.el.addEventListener('click', this.clickFun.bind(this));
    };
    keyPressFun(event) {
        event.cancelBubble = true;
        console.log('输入.....', event);
        this.options.placeholderVisible = false;
        // 回车
        if(event.keyCode === 13) {
            this.newRow(event, this.el);
            return;
        }
        let node;
        if(!event.target.children.length) {
            node = this.getDom('tItem', '');
            event.target.appendChild(node);
            // 处理没有tItem时候@人
            const sel = this.select;
            if(sel) {
                const range = sel.getRangeAt(0);
                const Container = range.commonAncestorContainer;
                if(Container.className === 'asDe') {
                    range.setStart(Container.firstElementChild, 0);
                }
            }
        }
        if(event.target.localName !== 'input') {
            switch(event.keyCode) { // @
                case 64: setTimeout(() => { this.resolveLink(); }, 50);
                    setTimeout(() => {
                        this.addLinkSelect();
                    }, 100);
                    break;
                default:
                    this.addText(event, node);
                    break;
            }
        }
    }
    keydownFun(event) {
        console.log('keydownFun', event)
        event.stopPropagation();
        // delete
        if(event.keyCode === 8 || event.keyCode === 8) {
            this.deleteItem(event);
        }
        this.emptyRange();
    }
    keyupFun() {
        console.log('keyupFun')
        const sel = this.select;
        let range;
        if(sel) {
            range = sel.getRangeAt(0);
        }
        const node = this.el;
        if(~node.innerHTML.indexOf('<br>')) {
            node.innerHTML = node.innerHTML.replace('<br>', '');
        }
        range && (this.lastRange = range);
    }
    clickFun() {
        this.getCursor();
    };
    compositionstartFun(event) {
        // console.log('compositionstart...', event);
        event.stopPropagation();
        this.options.placeholderVisible = false;
        if(!event.target.querySelectorAll('.tItem').length) {
            const node = this.getDom('tItem', '');
            event.target.appendChild(node);
            this.emptyRange();
        }
    }
    compositionendFun(event) {
        // console.log('compositionend...', event);
        event.stopPropagation();
        const sel = this.select;
        let range;
        if(sel) {
            range = sel.getRangeAt(0);
        }
        this.options.placeholderVisible = false;
        if(event.data === '@') {
            $nextTick(() => { this.resolveLink(); });
            setTimeout(() => {
                this.addLinkSelect();
            }, 100);
        }
        // 解决火狐输入文字range不变的情况
        range && (this.lastRange = range);
    }
    // 粘贴，只处理文本，图片后面再处理
    pastetFun(event) {
        // event.preventDefault();
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        let frag;
        // 判断容器
        if(!this.el.querySelectorAll('.tItem').length) {
            frag = this.getDom('tItem');
        }
        let text;
        let clp = (event.originalEvent || event).clipboardData;
        // 兼容针对于opera ie等浏览器
        if(clp === undefined || clp === null) {
            text = window.clipboardData.getData('text') || '';
            if(text !== '') {
                this.options.placeholderVisible = false;
                if(window.getSelection) {
                    // 针对于ie11 10 9 safari
                    let newNode = document.createTextNode(text);
                    if(frag) {
                        frag.appendChild(newNode);
                        this.el.appendChild(frag);
                    } else{
                        range.insertNode(newNode);
                    }
                    $nextTick(() => {
                        this.moveRange(sel, newNode, range);
                    });
                } else{
                    // 兼容ie10 9 8 7 6 5
                    document.selection.createRange().pasteHTML(text);
                }
            }
        } else{
            // 兼容chorme或hotfire
            text = clp.getData('text/plain') || '';
            if(text !== '') {
                console.group('%c粘贴内容：', 'color: #00aaaa');
                console.log(text);
                console.groupEnd();
                this.options.placeholderVisible = false;
                let newNode = document.createTextNode(text);
                if(frag) {
                    frag.appendChild(newNode);
                    this.el.appendChild(frag);
                } else{
                    range.insertNode(newNode);
                }
                $nextTick(() => {
                    this.moveRange(sel, newNode, range);
                });
            }
        }
        // console.log(event);
        event.preventDefault();
    }
    // 添加@选择框
    addLinkSelect(txt) {
        $create('com.bsoft.bsdrc.pages.components.comment.answerComment.LinkSelect', {
            personList: this.options.personList,
        }).then((mod) => {
            let linkSelect = this.el.querySelector('#linkSelect');
            linkSelect.appendChild(mod.el);
            mod.on('selectBlur', () => {
                setTimeout(() => {
                    if(linkSelect) {
                        mod.vue.$destroy();
                        linkSelect?.parentNode.removeChild(linkSelect);
                        linkSelect = null;
                        // console.log(this.select, this.lastRange, txt);
                        if(txt) this.moveRange(this.select, txt, this.lastRange);
                    }
                }, 100);
            });
            mod.on('linkSelect', (val) => {
                mod.fireEvent('selectBlur');
                setTimeout(() => {
                    this.addLink(val);
                }, 0);
            });
        });
    }
    // 获取光标位置
    getCursor() {
        const sel = window.getSelection();
        if(!sel) {
            return;
        }
        const node = sel.anchorNode;
        this.select = sel;
        this.lastNode = node;
        const range = sel.getRangeAt(0);
        if(this.el.contains(range.commonAncestorContainer)) this.lastRange = range;
        // console.log(this, range, this.lastRange);
        // this.lastRange = sel.getRangeAt(0);
    }
    // 聚焦
    funFocus(event) {
        console.log('聚焦.......');
        this.isFocus = true;
        const target = event?.target;
        if(!this.select) {
            this.select = window.getSelection();
        }
        // console.log(this.select);
        // let lastNode = this.findLastChildNode(target);
        setTimeout(() => {
            let range = this.select.getRangeAt(0);
            console.log(range)
            if(this.el.contains(range.commonAncestorContainer)) this.lastRange = range;
            if(!target.querySelectorAll('.tItem').length) {
                const el = this.getDom('tItem', '');
                target.appendChild(el);
                this.lastInsertNode = el;
                this.lastNode = el;
                this.moveRange(this.select, el.childNodes[0], this.lastRange);
            }
            // console.log(this.select, range, this.lastRange);
        }, 0);
    }
    blurFun() {
        console.log('失焦.....');
        this.isFocus = false;
        this.getCursor();
    }
    // 文字
    addText(event, node) {
        const sel = this.select;
        const range = sel?.getRangeAt(0);
        // console.log(range, this.lastRange);
        // 处理删除所有元素，重新输入文字range不变问题
        if(node) {
            event.preventDefault();
            const txt = document.createTextNode(event.key || event.data);
            node.appendChild(txt);
            this.moveRange(sel, txt, range);
            // return;
        }
    }
    // 表情
    addEmoji(node, val, style) {
        const sel = window.getSelection();
        const anchorNode = this.lastRange?.commonAncestorContainer;
        const[frame, el, txt] = this.getDom('eItem', val, style);
        if(this.lastRange && node.querySelectorAll('.tItem').length) {
            // console.log(anchorNode.innerText)
            if(anchorNode.className === 'asDe' && anchorNode.innerText === '') {
                this.lastRange.setStart(anchorNode.childNodes[0], 0);
            }
            // console.log(this.lastRange)
            this.lastRange.insertNode(frame);
        } else{
            const el = this.getDom('tItem');
            el.appendChild(frame);
            this.el.appendChild(el);
        }
        this.lastInsertNode = el;
        const range = document.createRange();
        range.selectNodeContents(txt);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    // 删除
    deleteItem(event) {
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        let node = range.commonAncestorContainer;
        // console.log(node, this.el.children, node.childNodes, node.innerHTML);
        // console.log(range, this.lastRange, range.startOffset);
        if(range.endContainer !== range.startContainer) {
            // event.preventDefault();
            return;
        }
        if(node.nodeType === 3 && !range.startOffset) {
            let no = node.previousSibling;
            // console.log(no);
            if(no && (no.className === 'eItem' || no.className === 'lItem')) {
                event.preventDefault();
                node.parentNode.removeChild(no);
                if(!node.nodeValue.length) {
                    node.parentNode.removeChild(node);
                }
                return;
            }
            let noPre = no?.previousSibling;
            if(noPre && (noPre.className === 'eItem' || noPre.className === 'lItem')) {
                event.preventDefault();
                node.parentNode.removeChild(noPre);
                node.parentNode.removeChild(no);
            }
        }
        if(range.startOffset === range.endOffset) {
            let cur = node.childNodes[range.startOffset - 1];
            let preCurEl = cur?.previousElementSibling;
            // console.log(cur, preCurEl);
            if(cur && cur.nodeType === 3) {
                if(cur.nodeValue.length) {
                    event.preventDefault();
                    cur.nodeValue = cur.nodeValue.substring(0, cur.nodeValue.length - 1);
                    // BUG 文本清空后，需删除当前文本dom节点
                    if(!cur.nodeValue) {
                        cur.parentNode.removeChild(cur);
                    }
                    return;
                }
            }
            if(preCurEl && preCurEl.nodeType !== 3 && preCurEl.nodeName === 'SPAN') {
                if(preCurEl?.className === 'eItem' || preCurEl?.className === 'lItem') {
                    event.preventDefault();
                    if(cur.nodeName !== 'SPAN') {
                        node.removeChild(preCurEl);
                    }
                    node.removeChild(cur);
                    preCurEl = null;
                }
            }
            cur = null;
        } else{
            // 删除多个元素
            // if(node.nodeType !== 3) {
            //     event.preventDefault();
            //     let i = range.endOffset - range.startOffset;
            //     while(i >= 0 && node.firstChild) {
            //         node.removeChild(node.firstChild);
            //     }
            // }
        }
    }
    resolveLink(handle = false) {
        const sel = window.getSelection();
        let range = sel?.getRangeAt(0);
        const el = document.createElement('span');
        el.id = 'linkSelect';
        el.contentEditable = false;
        // console.log(sel, range, this);
        if(!this.el.querySelectorAll('.tItem').length) {
            const frag = this.getDom('tItem');
            const txt = document.createTextNode('@');
            frag.appendChild(txt);
            frag.appendChild(el);
            this.el.appendChild(frag);
            this.lastNode = txt;
            defer.resolve(txt);
            if(!this.lastRange) {
                this.select = window.getSelection();
                const rg = document.createRange();
                rg.setStartAfter(el);
                this.lastRange = rg;
            }
            return;
        }
        if(handle) {
            // console.log(this.lastRange);
            // range = this.lastRange;
            const anchorNode = this.lastRange?.commonAncestorContainer;
            if(anchorNode.className === 'asDe' && anchorNode.innerText === '') {
                this.lastRange.setStart(anchorNode.childNodes[0], 0);
            }
            // console.log(this.lastNode, anchorNode, this.lastRange);
            const frag = document.createDocumentFragment();
            const txt = document.createTextNode('@');
            frag.appendChild(txt);
            frag.appendChild(el);
            this.lastRange.insertNode(frag);
            this.lastNode = txt;
            return;
        }
        this.lastInsertNode = el;
        range.insertNode(el);
        // this.moveRange(sel, el, range);
    }
    // @人
    addLink(val) {
        const sel = window.getSelection();
        const index = this.lastNode?.nodeValue.indexOf('@');
        // const range = sel.getRangeAt(0)
        // console.log(this, index, sel.anchorNode, this.lastRange.commonAncestorContainer);
        // index && this.lastNode.nodeValue.substring(index, 1);
        if(this.lastNode && ~index) {
            this.lastNode.nodeValue = this.lastNode.nodeValue.substring(0, index);
        }
        // this.lastNode && (this.lastNode.nodeValue = this.lastNode.nodeValue.substring(0, index));
        const[frame, el, txt] = this.getDom('lItem', val);
        this.lastRange.setStartAfter(this.lastNode);
        this.lastRange.insertNode(frame);
        if(!this.lastNode.nodeValue.length) {
            this.lastNode.parentNode.removeChild(this.lastNode);
            // console.dir(this.lastNode);
            // console.dir(this.el.childNodes);
            this.lastNode = null;
        }
        this.lastInsertNode = el;
        this.moveRange(sel, txt, this.lastRange);
    }
    // 换行
    newRow(event, node) {
        const me = this;
        const sel = window.getSelection();
        event.preventDefault();
        let range = sel.getRangeAt(0);
        const el = this.getDom('tItem');
        const txt = document.createTextNode('');
        el.appendChild(txt);
        node.appendChild(el);
        this.lastNode = sel.anchorNode;
        this.lastInsertNode = el;
        this.lastRange = range;
        me.moveRange(sel, txt, range);
    }
    // 光标移动
    moveRange(sel, el, range) {
        if(!sel) {
            return;
        }
        range = range.cloneRange();
        if(el) {
            range.setStartAfter(el);
        }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    findLastChildNode(parentNode) {
        if(typeof parentNode === 'undefined') {
            throw new Error('parentNode is not defined');
        }
        if(!parentNode.children.length) {
            return parentNode;
        }
        const chd = parentNode.children[parentNode.children.length - 1];
        return chd.children.length ? chd.children[chd.children.length - 1] : chd;
    }
    emptyRange() {
        if(this.el.querySelectorAll('.tItem').length === 0 || (this.el.children.length === 1 && this.el.innerHTML === this.defaultHTML)) {
            const sel = this.select;
            if(!sel) {
                return;
            }
            const range = sel.getRangeAt(0);
            const Container = range.commonAncestorContainer;
            if(Container.className === 'asDe') {
                Container.firstElementChild && range.setStart(Container.firstElementChild, 0);
            }
        }
    }
    // 生成对应dom
    getDom() {
        const arg = arguments;
        let type = [].shift.call(arg);
        return domCreator[type](...arg);
    }
    destory() {
        try {
            this.select = null;
            this.lastNode = null;
            this.lastInsertNode = null;
            this.lastRange = null;
            this.el.removeEventListener('keypress', this.keyPressFun.bind(this));
            this.el.removeEventListener('keydown', this.keydownFun.bind(this));
            this.el.removeEventListener('keyup', this.keyupFun.bind(this));
            this.el.removeEventListener('blur', this.blurFun.bind(this));
            this.el.removeEventListener('focus', this.funFocus.bind(this));
            this.el.removeEventListener('compositionend', this.compositionendFun.bind(this));
            this.el.removeEventListener('compositionstart', this.compositionstartFun.bind(this));
            this.el.removeEventListener('paste', this.pastetFun.bind(this));
            this.isFirefox && this.el.removeEventListener('click', this.clickFun.bind(this));
            this.options = null;
            this.el = null;
        } catch(err) {
            console.log(err);
        }
    }
}