import React from 'react'

export default function ClientInfo({ data, onChange }) {
	const h = (key) => (e) => onChange({ ...data, [key]: e.target.value })
	return (
		<div className='mb-6'>
			<label className='block text-sm text-gray-500 mb-1'>
				Client / Entreprise concernée
			</label>
			<input
				type='text'
				value={data.issuer}
				onChange={h('issuer')}
				className='w-full border border-gray-200 p-2 rounded mb-4'
			/>
			<div className='grid md:grid-cols-2 gap-4'>
				<div>
					<label className='block text-sm text-gray-500 mb-1'>Adresse de facturation</label>
					<input
						type='text'
						value={data.billTo}
						onChange={h('billTo')}
						className='w-full border border-gray-200 p-2 rounded'
					/>
				</div>
				<div>
					<label className='block text-sm text-gray-500 mb-1'>
						Adresse de livraison (facultative)
					</label>
					<input
						type='text'
						value={data.shipTo}
						onChange={h('shipTo')}
						className='w-full border border-gray-200 p-2 rounded'
					/>
				</div>
				<div>
					<label className='block text-sm text-gray-500 mb-1'>Téléphone client</label>
					<input
						type='text'
						value={data.clientPhone}
						onChange={h('clientPhone')}
						className='w-full border border-gray-200 p-2 rounded'
						placeholder='+243…'
					/>
				</div>
				<div>
					<label className='block text-sm text-gray-500 mb-1'>Email client</label>
					<input
						type='email'
						value={data.clientEmail}
						onChange={h('clientEmail')}
						className='w-full border border-gray-200 p-2 rounded'
						placeholder='client@exemple.com'
					/>
				</div>
			</div>
		</div>
	)
}
