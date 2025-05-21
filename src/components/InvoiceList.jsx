export default function InvoiceList({ invoices }) {
	if (invoices.length === 0) {
		return <div className='bg-white p-4 rounded shadow'>Aucune facture.</div>
	}

	return (
		<div className='bg-white p-4 rounded shadow'>
			<h2 className='text-xl font-semibold mb-2'>Factures</h2>
			<ul>
				{invoices.map((inv) => (
					<li key={inv.id} className='flex justify-between py-1 border-b'>
						<span>{inv.client}</span>
						<span>{inv.amount} €</span>
					</li>
				))}
			</ul>
		</div>
	)
}
