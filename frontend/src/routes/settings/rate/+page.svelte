<script lang="ts">
import { page } from '$app/state'
import Editable from '$lib/components/editable.svelte'
import { getPortfolio } from '$lib/current.svelte'
import * as m from '$lib/paraglide/messages'

const pf = $derived(getPortfolio())
const index = $derived(Number(page.url.searchParams.get('index')))
const currency = $derived(pf?.currencies[index])
</script>

{#if currency}
  <h1 class="text-lg font-semibold mb-4">{m.settingsRatesTitle({ currency: currency.iso })}</h1>
  <Editable bind:table={currency.rates} maker={() => ({ date: new Date(), rate: 0 })} {currency} baseCurrency={pf.baseCurrency} />
{:else}
  <p>{m.settingsNoRatesCurrency()}</p>
{/if}
