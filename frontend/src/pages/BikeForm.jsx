import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage } from "../api";

const initialForm = {
  vehicle_number: "",
  buyer_name: "",
  buyer_phone: "",
  buyer_address: "",
  seller_name: "",
  seller_phone: "",
  seller_address: "",
};

const uploads = [
  ["rc", "RC Photos"],
  ["insurance", "Insurance Photos"],
  ["pollution", "Pollution Photos"],
  ["noc", "NOC Photos"],
  
];

function UploadField({ name, label, help, file, existing, required, onChange }) {
  return (
    <label className={`bike-upload ${file ? "selected" : ""}`}>
  <i className={`bi ${file ? "bi-check-circle-fill" : "bi-cloud-arrow-up"}`} />
  <strong>{label}{required && " *"}</strong>

  <span>
    {Array.isArray(file)
      ? `${file.length} photo(s) selected`
      : (existing ? "Current photo saved" : help)}
  </span>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    required={required}
    onChange={(event) => onChange(name, Array.from(event.target.files))}
  />
</label>
  );
}

export default function BikeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({});
  const [existing, setExisting] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/bikes/${id}/`).then(({ data }) => {
      setForm(Object.fromEntries(Object.keys(initialForm).map((key) => [key, data[key] || ""])));
      setExisting(data);
    }).catch((err) => setError(errorMessage(err)));
  }, [id]);

 const save = async (event) => {
  event.preventDefault();
  setSaving(true);
  setError("");

  const body = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      body.append(key, value);
    }
  });

 Object.entries(files).forEach(([key, value]) => {
    // RC Photos
files.rc?.forEach((file, index) => {
  if (index < 5) {
    body.append(`rc_photo_${index + 1}`, file);
  }
});

// Insurance Photos
files.insurance?.forEach((file, index) => {
  if (index < 5) {
    body.append(`insurance_photo_${index + 1}`, file);
  }
});

// Pollution Photos
files.pollution?.forEach((file, index) => {
  if (index < 5) {
    body.append(`pollution_photo_${index + 1}`, file);
  }
});

// NOC Photos
files.noc?.forEach((file, index) => {
  if (index < 5) {
    body.append(`noc_photo_${index + 1}`, file);
  }
});

// Buyer Photos
files.buyer?.forEach((file, index) => {
  if (index < 5) {
    body.append(`buyer_photo_${index + 1}`, file);
  }
});

// Seller Photos
files.seller?.forEach((file, index) => {
  if (index < 5) {
    body.append(`seller_photo_${index + 1}`, file);
  }
});
// Buyer Identity Photos
files.buyer_identity?.forEach((file, index) => {
  if (index < 5) {
    body.append(`buyer_identity_photo_${index + 1}`, file);
  }
});

// Seller Identity Photos
files.seller_identity?.forEach((file, index) => {
  if (index < 5) {
    body.append(`seller_identity_photo_${index + 1}`, file);
  }
});
 
});
  try {
    if (id) {
      await api.patch(`/bikes/${id}/`, body);
    } else {
      console.log([...body.entries()]);
      await api.post("/bikes/", body);
      

      
    }

    navigate("/");
  } catch (err) {
  console.log("SAVE ERROR:", err);
  console.log("RESPONSE:", err.response);
  console.log("DATA:", err.response?.data);

  setError("Save Failed");

  window.scrollTo({
    top: 0,
    behavior: "smooth"});
} finally {
    setSaving(false);
  }
};

  const textField = (name, label, options = {}) => (
    <label className={options.full ? "form-field full-field" : "form-field"}>
      <span>{label}{options.required && " *"}</span>
      {options.textarea ? (
        <textarea rows="3" required={options.required} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
      ) : (
        <input type={options.type || "text"} required={options.required} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
      )}
    </label>
  );

  return (
    <>
      <div className="simple-page-heading">
        <div><h1>{id ? "Edit Bike Record" : "Add New Bike"}</h1><p>Enter the bike, document, buyer and seller information.</p></div>
        <Link className="back-link" to="/"><i className="bi bi-arrow-left" /> Back to Records</Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="bike-form" onSubmit={save}>
        <section className="form-section">
          <div className="section-title"><span>1</span><div><h2>Bike Details</h2><p>Basic identification for this bike.</p></div></div>
          <div className="fields-grid">
            {textField("vehicle_number", "Vehicle Number", { required: true })}
          </div>
        </section>

        <section className="form-section">
          <div className="section-title"><span>2</span><div><h2>Bike Documents</h2><p>Upload clear photos in JPG, PNG or WebP format.</p></div></div>
          <div className="uploads-grid">
  {uploads.map(([name, label]) => (
    <UploadField
      key={name}
      name={name}
      label={label}
      help="Upload photo"
      file={files[name]}
      existing={existing[name]}
      required={false}
      onChange={(key, file) =>
        setFiles({ ...files, [key]: file })
      }
    />
  ))}
</div>
        </section>

        <section className="form-section">
          <div className="section-title"><span>3</span><div><h2>Buyer Details</h2><p>Information about the bike buyer.</p></div></div>
          <div className="fields-grid">
            {textField("buyer_name", "Buyer Name")}
            {textField("buyer_phone", "Buyer Phone", { type: "tel" })}
            {textField("buyer_address", "Buyer Address", { textarea: true, full: true })}
            <UploadField
  name="buyer_identity"
  label="Buyer Identity"
  help="Upload Photo / Aadhaar / PAN"
  file={files.buyer_identity}
  existing={existing.buyer_identity}
  required={false}
  onChange={(key,file)=>setFiles({...files,[key]:file})}
/>
</div>
        </section>

        <section className="form-section">
          <div className="section-title"><span>4</span><div><h2>Seller Details</h2><p>Information about the bike seller.</p></div></div>
          <div className="fields-grid">
            {textField("seller_name", "Seller Name")}
            {textField("seller_phone", "Seller Phone", { type: "tel" })}
            {textField("seller_address", "Seller Address", { textarea: true, full: true })}
          <UploadField
  name="seller_identity"
  label="Seller Identity"
  help="Upload Photo / Aadhaar / PAN"
  file={files.seller_identity}
  existing={existing.seller_identity}
  required={false}
  onChange={(key,file)=>setFiles({...files,[key]:file})}
/>
          </div>
        </section>

        <div className="bike-form-actions">
          <Link to="/">Cancel</Link>
          <button disabled={saving}>{saving ? "Saving..." : id ? "Update Bike Record" : "Save Bike Record"}</button>
        </div>
      </form>
    </>
  );
}
