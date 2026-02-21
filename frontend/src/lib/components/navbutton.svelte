<script lang="ts">
let {
  action,
  name,
  tooltip,
  variant = 'default',
  disabled = false,
}: {
  action: () => void
  name: string
  tooltip: string
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
} = $props()

const styles = {
  default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
}
</script>

<button 
  onclick={action} 
  title={tooltip} 
  class="rounded px-3 py-1 text-xs font-medium transition-colors {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} {styles[variant]}" 
  disabled={disabled}
>
  {name}
</button>
