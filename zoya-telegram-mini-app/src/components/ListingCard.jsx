import '../styles/ListingCard.css'

export default function ListingCard({ listing, onClick }) {
  const images = listing.images || []
  const imageUrl = images[0]

  return (
    <div onClick={onClick} className="listing-card">
      <div className="card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={listing.title} />
        ) : (
          <div className="no-image">📸</div>
        )}
        {listing.condition && (
          <div className="condition-badge">{listing.condition}</div>
        )}
      </div>

      <div className="card-info">
        <h3 className="card-title">{listing.title}</h3>
        <p className="card-price">💰 {listing.coinPrice?.toLocaleString()}</p>
        <p className="card-meta">
          {listing.category} • {listing.size || 'Bir xil'}
        </p>
      </div>
    </div>
  )
}