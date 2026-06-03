export default function ListingCard({ listing, onClick }) {
  const images = listing.images || []
  const imageUrl = images[0]

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="relative bg-gray-200 aspect-square overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            📸
          </div>
        )}
        {listing.condition && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {listing.condition}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-gray-800 line-clamp-2">
          {listing.title}
        </h3>
        <p className="text-orange-500 font-bold text-lg mt-2">
          💰 {listing.coinPrice?.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {listing.category} • {listing.size || 'Bir xil'}
        </p>
      </div>
    </div>
  )
}