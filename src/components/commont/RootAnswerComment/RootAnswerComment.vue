<script setup>
import { ref, reactive, toRefs, useTemplateRef } from 'vue'
import LinkSelect from "../LinkSelect/LinkSelect.vue"
import faceData from "../FaceListData"
import AwUtils from "../AwUtils"
import { ElMessage } from 'element-plus'
import { Picture } from "@element-plus/icons-vue"
import '../CommonComment.css'

let awUObj = null;

const props = defineProps({
    commonId: String,
})

const asDe = useTemplateRef('asDe');
const commentImg = useTemplateRef('commentImg');

const obj = reactive({
    commentOptions: {
        placeholderVisible: true,
        personList: null,
    },
    // placeholderVisible: true,
    imgFile: null,
    faceList: faceData || [],
    id: props.commonId,
    loading: false,
    imgUrl: null,
    emojiItemVisible: false,
    personList: [],
})

const { commentOptions, imgFile, faceList, id, loading, imgUrl, emojiItemVisible, personList } = toRefs(obj)

getLinkPersonList().then((data) => {
    commentOptions.value = { ...commentOptions.value, personList: data };
    awUObj = new AwUtils(asDe.value, commentOptions.value);
})

// 获取@人列表
function getLinkPersonList() {
    return Promise.resolve([{ value: "cs", label: "常帅" }])
}

const handleClickAnsIn = () => {
    asDe.value.focus();
}

const handleSelectImg = () => {
    const File = file.target.files[0];
    if (~File.name.search(/src/i)) {
        ElMessage.warning('上传的图片名称中不能包含src');
        commentImg.value.value = '';
        return;
    }
    imgFile.value = File;
    const URL = window?.URL.createObjectURL(File);
    imgUrl.value = URL;
}

const handleDeleteImg = () => {
    imgUrl.value = null;
    imgFile.value = null;
    commentImg.value.value = '';
}

const handleAddLink = async () => {
    const linkSelect = await me.el.querySelector('#linkSelect');
    if (linkSelect) {
        return;
    }
    commentOptions.value.placeholderVisible = false;

    const txt = await awUObj.resolveLink('handle');
    awUObj.addLinkSelect(txt);
}

const handleAddCommentImg = () => {
    if (imgFile.value) {
        ElMessage({ message: '只能上传一张图片', type: 'warning', duration: 2000 });
        return;
    }
    commentImg.value.click();
}

const handleAddEmoji = () => {
    commentOptions.value.placeholderVisible = false;
    setTimeout(() => {
        awUObj.addEmoji(asDe.value, `[${value}]`, style);
    }, 50);
}

const handleEmitCommentData = () => { }

const showEmojiItem = () => {
    if (!emojiItemVisible.value) {
        document.body.dispatchEvent(new Event('click'));
    }
    emojiItemVisible.value = !emojiItemVisible.value;
}
</script>

<template>
    <div id="RootAnswerComment">
        121213
        <div class="answerInput" @click="handleClickAnsIn">
            <div class="placeholder" v-if="commentOptions.placeholderVisible">请输入</div>
            <div class="asDe" ref="asDe" contenteditable="true"></div>
            <input ref="commentImg" multiple="" type="file" accept="image/webp,image/jpg,image/jpeg,image/png,image/gif"
                style="display: none;" @change="handleSelectImg" />
        </div>
        <div class="imgContainer" v-if="imgUrl">
            <el-image :src="imgUrl" :preview-src-list="[imgUrl]">
            </el-image>
            <div class="deleteIcon flex" @click.stop="handleDeleteImg">
                <i class="el-icon-close"></i>
            </div>
        </div>
        <div class="answerTooltip mt16 flex jc-sb">
            <div class="flex jc-s">
                <el-tooltip class="item" effect="dark" content="@你想通知的人">
                    <!-- <span class="linkO" @click.stop="handleAddLink">@</span> -->
                    <i class="linkO fa fa-at" aria-hidden="true" @click="handleAddLink"></i>
                </el-tooltip>
                <el-tooltip class="item" effect="dark" content="插入图片">
                    <el-icon size="20">
                        <Picture @click="handleAddCommentImg" />
                    </el-icon>
                </el-tooltip>
                <el-tooltip class="emojiItem" ref="emojiItem" content="插入表情" :disabled="emojiItemVisible">
                    <!-- el-tooltip与el-popover之间需要有一层DOM -->
                    <i>
                        <el-popover placement="bottom" :teleported="false" :width="300" trigger="click"
                            :visible="emojiItemVisible">
                            <ul class="emojiList flex jc-s">
                                <li v-for="item in faceList" @click.stop="handleAddEmoji(item.title, item.place)">
                                    <span :title="item.title"
                                        :style="{ 'backgroundPosition': item.place + ', center' }">
                                    </span>
                                </li>
                            </ul>
                            <template #reference>
                                <svg @click.stop="showEmojiItem" class="emoji" fill="currentColor" viewBox="0 0 24 24"
                                    width="26" height="26">
                                    <path
                                        d="M7.523 13.5h8.954c-.228 2.47-2.145 4-4.477 4-2.332 0-4.25-1.53-4.477-4zM12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zm0-1.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zm-3-8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z">
                                    </path>
                                </svg>
                            </template>
                        </el-popover>
                    </i>
                </el-tooltip>
            </div>
            <el-button type="primary" size="default" class="putComment" @click="handleEmitCommentData">发表</el-button>
        </div>
    </div>

</template>

<style scoped lang="less">
#RootAnswerComment {
    width: 100%;
    min-width: 750px;
    margin-top: 20px;
    overflow: hidden;

    .answerInput {
        position: relative;
        min-height: 120px;
        padding: 17px 20px;
        border: 1px solid #C7D0DA;
        border-radius: 8px;

        &:focus-within {
            border-color: #4088fe;
        }

        .asDe {
            min-height: 84px;
        }
    }

    .answerTooltip>div {
        color: #2E78F1;
    }

    .linkO {
        font-size: 20px;
        margin-right: 8px;
        cursor: pointer;
    }
}
</style>
