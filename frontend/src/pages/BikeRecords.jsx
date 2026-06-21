import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../api";

const imageFields = [
  ["rc_photo_1", "RC 1"],
  ["rc_photo_2", "RC 2"],
  ["rc_photo_3", "RC 3"],
  ["rc_photo_4", "RC 4"],
  ["rc_photo_5", "RC 5"],

  ["insurance_photo_1", "Insurance 1"],
  ["insurance_photo_2", "Insurance 2"],
  ["insurance_photo_3", "Insurance 3"],
  ["insurance_photo_4", "Insurance 4"],
  ["insurance_photo_5", "Insurance 5"],

  ["pollution_photo_1", "Pollution 1"],
  ["pollution_photo_2", "Pollution 2"],
  ["pollution_photo_3", "Pollution 3"],
  ["pollution_photo_4", "Pollution 4"],
  ["pollution_photo_5", "Pollution 5"],

  ["noc_photo_1", "NOC 1"],
  ["noc_photo_2", "NOC 2"],
  ["noc_photo_3", "NOC 3"],
  ["noc_photo_4", "NOC 4"],
  ["noc_photo_5", "NOC 5"],

  ["buyer_photo_1", "Buyer 1"],
  ["buyer_photo_2", "Buyer 2"],
  ["buyer_photo_3", "Buyer 3"],
  ["buyer_photo_4", "Buyer 4"],
  ["buyer_photo_5", "Buyer 5"],

  ["seller_photo_1", "Seller 1"],
  ["seller_photo_2", "Seller 2"],
  ["seller_photo_3", "Seller 3"],
  ["seller_photo_4", "Seller 4"],
  ["seller_photo_5", "Seller 5"],
];

export default function BikeRecords() {
  const [bikes, setBikes] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [smartMessage, setSmartMessage] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [searchMode, setSearchMode] = useState("normal");

  const load = async () => {
    try {
      const { data } = await api.get(`/bikes/${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setBikes(data.results || data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  useEffect(() => {
    if (searchMode === "smart") return undefined;
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, searchMode]);

  const showImage = async (bike, field, label) => {
    const { data } = await api.get(`/bikes/${bike.id}/image/${field}/`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    setPreview({
     url,
     label: `${bike.vehicle_number} - ${label}`,
     bikeId: bike.id,
     field
   });
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const remove = async (bike) => {
    if (!window.confirm(`Delete bike record ${bike.vehicle_number}?`)) return;
    await api.delete(`/bikes/${bike.id}/`);
    setSelected(null);
    load();
  };

  const smartSearch = async (text = search) => {
    if (!text.trim()) {
      setSmartMessage("Type or speak what you want to find.");
      return;
    }
    setSearchMode("smart");
    setSmartLoading(true);
    setError("");
    try {
      const { data } = await api.post("/bikes/smart-search/", { query: text });
      setBikes(data.results);
      setSmartMessage(`${data.interpretation} Found ${data.results.length} record${data.results.length === 1 ? "" : "s"}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSmartLoading(false);
    }
  };

  const voiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice search is not supported in this browser. Use Google Chrome or Microsoft Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setError("");
      setSmartMessage("Listening...");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchMode("smart");
      setSearch(transcript);
      smartSearch(transcript);
    };
    recognition.onerror = () => setError("I could not hear that clearly. Please try again.");
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <>
      <div className="simple-page-heading">
        <div>
          <h1>Bike Records</h1>
          <p>All bike documents, buyer details and seller details.</p>
        </div>
        <Link className="add-bike-button" to="/add-bike"><i className="bi bi-plus-lg" /> Add New Bike</Link>
      </div>

      <section className="records-panel">
        <div className="records-toolbar">
          <div className="search-tools">
            <div className="records-search">
              <i className="bi bi-search" />
              <input
                value={search}
                onChange={(event) => {
                  setSearchMode("normal");
                  setSearch(event.target.value);
                  setSmartMessage("");
                }}
                onKeyDown={(event) => event.key === "Enter" && smartSearch()}
                placeholder='Try "buyer Ravi" or "vehicle TS09"'
              />
            </div>
            <button className={`voice-search-button ${listening ? "listening" : ""}`} onClick={voiceSearch} title="Voice search">
              <i className={`bi ${listening ? "bi-mic-fill" : "bi-mic"}`} />
            </button>
            <button className="smart-search-button" onClick={() => smartSearch()} disabled={smartLoading}>
              <i className="bi bi-stars" /> {smartLoading ? "Searching..." : "AI Search"}
            </button>
          </div>
          <span>{bikes.length} bike records</span>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {smartMessage && <div className="bike-smart-message"><i className="bi bi-stars" /> {smartMessage}</div>}
        <div className="bike-table-wrap">
          <table className="bike-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Documents</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bikes.map((bike) => (
                <tr key={bike.id}>
                  <td><strong className="vehicle-badge">{bike.vehicle_number}</strong></td>
                  <td><strong>{bike.buyer_name}</strong><small>{bike.buyer_phone || "No phone"}</small></td>
                  <td><strong>{bike.seller_name}</strong><small>{bike.seller_phone || "No phone"}</small></td>
                  <td>
  <span className="complete-badge">
    <i className="bi bi-check-circle-fill" />
    {" "}
    {[
      ...Array.from({ length: 5 }, (_, i) => bike[`rc_photo_${i + 1}`]),
      ...Array.from({ length: 5 }, (_, i) => bike[`insurance_photo_${i + 1}`]),
      ...Array.from({ length: 5 }, (_, i) => bike[`pollution_photo_${i + 1}`]),
      ...Array.from({ length: 5 }, (_, i) => bike[`noc_photo_${i + 1}`]),
      ...Array.from({ length: 5 }, (_, i) => bike[`buyer_identity_photo_${i + 1}`]),
      ...Array.from({ length: 5 }, (_, i) => bike[`seller_identity_photo_${i + 1}`]),
    ].filter(Boolean).length}
    {" "}photos
  </span>
</td>
                  <td className="record-actions">
                    <button onClick={() => setSelected(bike)} title="View"><i className="bi bi-eye" /></button>
                    <Link to={`/edit-bike/${bike.id}`} title="Edit"><i className="bi bi-pencil" /></Link>
                    <button className="delete" onClick={() => remove(bike)} title="Delete"><i className="bi bi-trash3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!bikes.length && <div className="records-empty"><i className="bi bi-bicycle" /><h2>No bike records</h2><p>Add your first bike to get started.</p></div>}
      </section>

      {selected && (
        <div className="modal-layer">
          <div className="bike-details-modal">
            <div className="details-head">
              <div><small>VEHICLE NUMBER</small><h2>{selected.vehicle_number}</h2></div>
              <button onClick={() => setSelected(null)}><i className="bi bi-x-lg" /></button>
            </div>
            <div className="person-grid">
              <div><span>Buyer Details</span><h3>{selected.buyer_name}</h3><p>{selected.buyer_phone || "No phone"}</p><p>{selected.buyer_address || "No address"}</p></div>
              <div><span>Seller Details</span><h3>{selected.seller_name}</h3><p>{selected.seller_phone || "No phone"}</p><p>{selected.seller_address || "No address"}</p></div>
            </div>
            <h3 className="photos-title">Uploaded Photos</h3>
            <div className="photo-buttons">
             {/* RC Photos */}
{/* RC Photos */}
{[1,2,3,4,5].some(i => selected[`rc_photo_${i}`]) && (
  <>
    <h4 className="photos-title">RC Photos</h4>

    <div className="photo-buttons">
      {[1,2,3,4,5].map(i =>
        selected[`rc_photo_${i}`] ? (
          <button
            key={`rc_${i}`}
            onClick={() =>
              showImage(
                selected,
                `rc_photo_${i}`,
                `RC Photo ${i}`
              )
            }
          >
            <i className="bi bi-image" />
            <span>Photo {i}</span>
            <small>Click to view</small>
          </button>
        ) : null
      )}
    </div>
  </>
)}

{/* Insurance Photos */}
{[1,2,3,4,5].some(i => selected[`insurance_photo_${i}`]) && (
  <>
    <h4 className="photos-title">Insurance Photos</h4>

    <div className="photo-buttons">
      {[1,2,3,4,5].map(i =>
        selected[`insurance_photo_${i}`] ? (
          <button
            key={`insurance_${i}`}
            onClick={() =>
              showImage(
                selected,
                `insurance_photo_${i}`,
                `Insurance Photo ${i}`
              )
            }
          >
            <i className="bi bi-image" />
            <span>Photo {i}</span>
            <small>Click to view</small>
          </button>
        ) : null
      )}
    </div>
  </>
)}
{/* Pollution Photos */}
{[1,2,3,4,5].some(i => selected[`pollution_photo_${i}`]) && (
  <>
    <h4 className="photos-title">Pollution Photos</h4>

    <div className="photo-buttons">
      {[1,2,3,4,5].map(i =>
        selected[`pollution_photo_${i}`] ? (
          <button
            key={`pollution_${i}`}
            onClick={() =>
              showImage(
                selected,
                `pollution_photo_${i}`,
                `Pollution Photo ${i}`
              )
            }
          >
            <i className="bi bi-image" />
            <span>Photo {i}</span>
            <small>Click to view</small>
          </button>
        ) : null
      )}
    </div>
  </>
)}
{/* NOC Photos */}
{[1,2,3,4,5].some(i => selected[`noc_photo_${i}`]) && (
  <>
    <h4 className="photos-title">NOC Photos</h4>

    <div className="photo-buttons">
      {[1,2,3,4,5].map(i =>
        selected[`noc_photo_${i}`] ? (
          <button
            key={`noc_${i}`}
            onClick={() =>
              showImage(
                selected,
                `noc_photo_${i}`,
                `NOC Photo ${i}`
              )
            }
          >
            <i className="bi bi-image" />
            <span>Photo {i}</span>
            <small>Click to view</small>
          </button>
        ) : null
      )}
    </div>
  </>
)}
{/* Buyer Identity Photos */}
{[1,2,3,4,5].some(i => selected[`buyer_identity_photo_${i}`]) && (
  <>
    <h4 className="photos-title">Buyer Identity Photos</h4>

    <div className="photo-buttons">
      {[1,2,3,4,5].map(i =>
        selected[`buyer_identity_photo_${i}`] ? (
          <button
            key={`buyer_identity_${i}`}
            onClick={() =>
              showImage(
                selected,
                `buyer_identity_photo_${i}`,
                `Buyer Identity ${i}`
              )
            }
          >
            <i className="bi bi-image" />
            <span>Photo {i}</span>
            <small>Click to view</small>
          </button>
        ) : null
      )}
    </div>
  </>
)}
{/* Seller Identity Photos */}
{[1,2,3,4,5].some(i => selected[`seller_identity_photo_${i}`]) && (
  <>
    <h4 className="photos-title">Seller Identity Photos</h4>

    <div className="photo-buttons">
      {[1,2,3,4,5].map(i =>
        selected[`seller_identity_photo_${i}`] ? (
          <button
            key={`seller_identity_${i}`}
            onClick={() =>
              showImage(
                selected,
                `seller_identity_photo_${i}`,
                `Seller Identity Photo ${i}`
              )
            }
          >
            <i className="bi bi-image" />
            <span>Photo {i}</span>
            <small>Click to view</small>
          </button>
        ) : null
      )}
    </div>
  </>
)}

            </div>


            <div className="details-actions">
              <button className="danger-text" onClick={() => remove(selected)}>Delete Record</button>
              <Link className="add-bike-button" to={`/edit-bike/${selected.id}`}>Edit Record</Link>
            </div>
          </div>
        </div>
      )}

      {preview && (
  <div className="image-preview" onClick={closePreview}>
    <div onClick={(event) => event.stopPropagation()}>
      <header>
  <strong>{preview.label}</strong>

  <div className="image-actions">
    <button
  className="image-action-btn"
  title="Download"
  onClick={async () => {
    try {
      const response = await api.get(
        `/bikes/${preview.bikeId}/image/${preview.field}/`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${preview.field}.jpg`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed");
    }
  }}
>
  <i className="bi bi-download" />
</button>

   <button
  className="image-action-btn delete-btn"
  title="Delete"
  onClick={async () => {
    if (!window.confirm("Delete this photo?")) return;

    try {
      await api.delete(
        `/bikes/${preview.bikeId}/image/${preview.field}/delete/`
      );

      alert("Photo deleted successfully");

      closePreview();

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to delete photo");
    }
  }}
>
  <i className="bi bi-trash" />
</button>
<button
  className="image-action-btn"
  onClick={closePreview}
  title="Close"
>
  <i className="bi bi-x-lg" />
</button>

  </div>
</header>

      <img src={preview.url} alt={preview.label} />
    </div>
  </div>
)}
    </>
  );
}
