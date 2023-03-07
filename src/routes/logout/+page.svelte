<script>
import { pbStore } from 'svelte-pocketbase';
import { goto } from '$app/navigation';

$pbStore.authStore.clear()
document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, expires: 0, secure: false })
goto("/");

</script>