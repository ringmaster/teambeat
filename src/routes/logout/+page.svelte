<script>
import { pbStore } from 'svelte-pocketbase';

$pbStore.authStore.clear()
document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0, secure: false })
document.location = "/"

</script>