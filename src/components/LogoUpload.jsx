import React, { useRef } from 'react'

export default function LogoUpload({ logo, onUpload }) {
	const inputRef = useRef()
	const handleFile = (e) => {
		const f = e.target.files[0]
		if (!f) return
		const reader = new FileReader()
		reader.onload = () => onUpload(reader.result)
		reader.readAsDataURL(f)
	}
	return (
		<div>
			{logo ? (
				<img
					src={logo}
					alt='logo'
					onClick={() => inputRef.current.click()}
					className='h-24 object-contain cursor-pointer border border-gray-200 rounded'
				/>
			) : (
				<button
					onClick={() => inputRef.current.click()}
					className='border border-gray-200 px-3 py-1 rounded hover:bg-gray-50'>
					Ajoutez votre logo
				</button>
			)}
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				onChange={handleFile}
				className='hidden'
			/>
		</div>
	)
}
