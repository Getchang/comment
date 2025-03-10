<script setup>
import { reactive, toRefs, onMounted, useTemplateRef, defineProps, defineModel, defineEmits } from 'vue'

const props = defineProps({
    personList: Array
})

const emite = defineEmits(['selectBlur', 'linkSelect'])

const model = defineModel()

const el = useTemplateRef('linkSelect')

const data = reactive({
    options: [],
    list: props.personList || [],
    loading: false,
})
const { options, list, loading } = toRefs(data)

function remoteMethod(query) {
    if (query !== '') {
        loading.value = true;
        setTimeout(() => {
            loading.value = false;
            options.value = list.value.filter(item => {
                return item.label.toLowerCase()
                    .indexOf(query.toLowerCase()) > -1;
            });
        }, 200);
    } else {
        options.value = list.value
    }
}

function handleLinkSelect(val) {
    let [res] = list.value.filter(item => item.value === val);
    emite('linkSelect', res);
}

function handleSelectBlur() {
    emite('selectBlur', model.value)
    model.value.value = ''
}

onMounted(() => {
    el.value.focus();
    remoteMethod('');
})
</script>
<template>
    <el-select v-model="model" size="mini" ref="linkSelect" class="linkOther" filterable remote placeholder="想用@提到谁"
        :remote-method="remoteMethod" @change="handleLinkSelect" @blur="handleSelectBlur" :loading="loading">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        </el-option>
    </el-select>

</template>