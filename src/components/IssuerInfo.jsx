import React from 'react'

export default function IssuerInfo({ data, onChange }) {
	const handleChange = (field) => (event) => {
		onChange({ ...data, [field]: event.target.value })
	}

	return (
		<div className='mb-6 bg-white p-4 rounded border border-gray-200 shadow'>
			<h2 className='text-lg font-semibold mb-3 text-gray-800'>
				Informations légales de l’émetteur
			</h2>
			<div className='grid gap-4 md:grid-cols-2'>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Nom de l’entreprise</label>
					<input
						type='text'
						value={data.companyName}
						onChange={handleChange('companyName')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='Ex. Société ABC SARL'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Adresse complète</label>
					<input
						type='text'
						value={data.address}
						onChange={handleChange('address')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='Rue, commune, ville'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Téléphone</label>
					<input
						type='text'
						value={data.phone}
						onChange={handleChange('phone')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='+243…'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Email</label>
					<input
						type='email'
						value={data.email}
						onChange={handleChange('email')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='contact@entreprise.cd'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>N° RCCM</label>
					<input
						type='text'
						value={data.rccm}
						onChange={handleChange('rccm')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='RCCM/XYZ/1234'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>ID Nat</label>
					<input
						type='text'
						value={data.idNat}
						onChange={handleChange('idNat')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='ID Nat ...'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>NIU / N° Impôt</label>
					<input
						type='text'
						value={data.niu}
						onChange={handleChange('niu')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='NIU ...'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Centre des impôts</label>
					<input
						type='text'
						value={data.taxCentre}
						onChange={handleChange('taxCentre')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='Centre des impôts de ...'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Banque</label>
					<input
						type='text'
						value={data.bankName}
						onChange={handleChange('bankName')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='Banque principale'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>N° de compte</label>
					<input
						type='text'
						value={data.bankAccount}
						onChange={handleChange('bankAccount')}
						className='w-full border border-gray-200 rounded p-2'
						placeholder='IBAN / Numéro de compte'
					/>
				</div>
				<div className='space-y-2'>
					<label className='block text-sm text-gray-600'>Code SWIFT / BIC</label>
					<input
						type='text'
						value={data.swift}
						onChange={handleChange('swift')}
						className='w-full border border-gray-200 rounded p-2'
					/>
				</div>
			</div>
			<div className='mt-4 space-y-2'>
				<label className='block text-sm text-gray-600'>
					Autres mentions légales ou contractuelles
				</label>
				<textarea
					value={data.other}
					onChange={handleChange('other')}
					className='w-full border border-gray-200 rounded p-2'
					rows={3}
					placeholder='Conditions particulières, pénalités de retard, etc.'
				/>
			</div>
		</div>
	)
}
