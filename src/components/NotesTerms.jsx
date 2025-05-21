import React from 'react'

export default function NotesTerms({ data, onChange }) {
	const h = (key) => (e) => onChange({ ...data, [key]: e.target.value })
	return (
		<div className='mb-6'>
			<label className='block text-sm text-gray-500 mb-1'>Notes</label>
			<textarea
				value={data.notes}
				onChange={h('notes')}
				className='w-full border border-gray-200 p-2 rounded mb-4'
				placeholder='Notes…'
			/>
			<label className='block text-sm text-gray-500 mb-1'>Terms</label>
			<textarea
				value={data.terms}
				onChange={h('terms')}
				className='w-full border border-gray-200 p-2 rounded'
				placeholder='Terms…'
			/>
		</div>
	)
}
