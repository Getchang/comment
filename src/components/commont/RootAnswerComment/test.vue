<script setup>
import { h, ref } from 'vue'

const count = ref(0)
return () => h('div', count.value)
</script>