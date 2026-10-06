import { ChangeEvent, FormEvent, useEffect, useState } from "react"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import { Icon, PageHero } from "../components/ui"
import { ApiError } from "../lib/api"
import { AppLink, useAppLocation } from "../lib/router"
import {
  availabilityOptions,
  collaborationOptions,
  genderOptions,
  joinAsOptions,
  organizationTypeOptions,
  type MemberType,
} from "../members/contracts"
import { submitJoinApplication } from "../members/repository"

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_ORIGINAL_PHOTO_BYTES = 25 * 1024 * 1024

const banner: PageBanner = {
  eyebrow: "Join us",
  title: "Become part of Samriddhi",
  body: "Volunteer, become a member or partner with us as an organisation. Every approved member receives a verifiable ID card and appears on our team page.",
  imageUrl: images.volunteers,
  imageAlt: "Volunteers working together in the community",
}

type PreparedPhoto = {
  blob: Blob
  name: string
}

/** Shrinks large phone photos before upload. Falls back to the original file if that fails. */
async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo"
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    })
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas is not available.")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    )
    if (!blob) throw new Error("The photo could not be compressed.")
    return { blob, name: `${baseName}.jpg` }
  } catch {
    return { blob: file, name: file.name || `${baseName}.jpg` }
  }
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "API_NOT_CONFIGURED")
      return "Applications are not available right now. Please contact the foundation directly."
    if (error.status === 429)
      return "Too many applications were sent from this connection. Please try again later."
    return error.message
  }
  return "Your application could not be sent. Check your connection and try again."
}

type Submitted = {
  reference: string
  name: string
  memberType: MemberType
}

export default function JoinPage() {
  const location = useAppLocation()
  const requestedType = new URLSearchParams(location.search).get("type")
  const [memberType, setMemberType] = useState<MemberType>(
    requestedType === "organization" ? "organization" : "individual",
  )
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<Submitted | null>(null)
  const isOrganization = memberType === "organization"
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (requestedType === "organization") setMemberType("organization")
    if (requestedType === "individual") setMemberType("individual")
  }, [requestedType])

  useEffect(() => {
    if (!photo) {
      setPreview("")
      return
    }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Choose a JPG, PNG or WebP image.")
      event.target.value = ""
      return
    }
    if (file.size > MAX_ORIGINAL_PHOTO_BYTES) {
      setPhotoError("Choose an image smaller than 25 MB.")
      event.target.value = ""
      return
    }
    setPhotoError("")
    setPhoto(file)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photo) {
      setPhotoError(
        isOrganization
          ? "Add your organisation's logo to continue."
          : "Add a clear photo of yourself to continue.",
      )
      return
    }
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? "").trim()
    const shared = {
      email: text("email"),
      phone: text("phone"),
      address: text("address"),
      city: text("city"),
      state: text("state"),
      pincode: text("pincode"),
      consent: data.get("consent") === "on",
    }
    const application = isOrganization
      ? {
          memberType,
          organizationName: text("organizationName"),
          organizationType: text("organizationType"),
          registrationNumber: text("registrationNumber"),
          gstin: text("gstin"),
          pan: text("pan"),
          website: text("website"),
          contactName: text("contactName"),
          contactDesignation: text("contactDesignation"),
          collaboration: text("collaboration"),
          about: text("about"),
          ...shared,
        }
      : {
          memberType,
          fullName: text("fullName"),
          dateOfBirth: text("dateOfBirth"),
          gender: text("gender"),
          occupation: text("occupation"),
          joinAs: text("joinAs"),
          availability: text("availability"),
          skills: text("skills"),
          motivation: text("motivation"),
          ...shared,
        }

    setError("")
    setSubmitting(true)
    try {
      const prepared = await preparePhoto(photo)
      const result = await submitJoinApplication(
        application,
        prepared.blob,
        prepared.name,
      )
      setSubmitted({
        reference: result.reference,
        name: isOrganization ? text("organizationName") : text("fullName"),
        memberType,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero banner={banner} />
      <section className="content-section content-section--gray">
        <div className="page-shell join-layout">
          <aside className="join-intro">
            <span className="eyebrow">How it works</span>
            <h2>Three simple steps</h2>
            <ol className="join-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>Send your application</strong>
                  <p>
                    Share your details and a clear photo, or your organisation's
                    logo.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Our team reviews it</strong>
                  <p>
                    We check every application before anyone is added to the
                    team.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Receive your ID card</strong>
                  <p>
                    Approved members get an ID card with a QR code and appear on
                    our team page.
                  </p>
                </div>
              </li>
            </ol>
            <div className="join-privacy">
              <Icon name="shield" size={18} />
              <span>
                Only your name, photo, role and city are shown publicly. Your
                phone, email and address stay private with the foundation. Read
                our <AppLink to="/privacy-policy">Privacy Policy</AppLink>.
              </span>
            </div>
          </aside>

          <section className="join-card">
            {submitted ? (
              <div className="join-success">
                <span className="join-success__icon">
                  <Icon name="check" size={34} />
                </span>
                <h2>Application received</h2>
                <p>
                  Thank you, {submitted.name}. Our team will review your
                  application. Once it is approved,{" "}
                  {submitted.memberType === "organization"
                    ? "your organisation"
                    : "you"}{" "}
                  will receive a member ID and appear on our team page.
                </p>
                <p className="join-success__reference">
                  Application reference <code>{submitted.reference}</code>
                </p>
                <div className="join-success__actions">
                  <AppLink className="button button--primary" to="/team">
                    Meet the team <Icon name="arrow" size={17} />
                  </AppLink>
                  <AppLink className="button button--text" to="/">
                    Back to home
                  </AppLink>
                </div>
              </div>
            ) : (
              <form className="join-form" onSubmit={submit}>
                <div
                  className="join-type"
                  role="radiogroup"
                  aria-label="I am joining as"
                >
                  <label
                    className={`join-type__option ${
                      !isOrganization ? "is-selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="memberType"
                      value="individual"
                      checked={!isOrganization}
                      onChange={() => setMemberType("individual")}
                    />
                    <Icon name="users" size={22} />
                    <span>
                      <strong>An individual</strong>
                      <small>Volunteer or member</small>
                    </span>
                  </label>
                  <label
                    className={`join-type__option ${
                      isOrganization ? "is-selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="memberType"
                      value="organization"
                      checked={isOrganization}
                      onChange={() => setMemberType("organization")}
                    />
                    <Icon name="building" size={22} />
                    <span>
                      <strong>A company or organisation</strong>
                      <small>CSR, sponsorship or partnership</small>
                    </span>
                  </label>
                </div>

                <fieldset>
                  <legend>
                    {isOrganization ? "Organisation details" : "Your details"}
                  </legend>
                  {isOrganization ? (
                    <>
                      <label className="join-field--full">
                        Organisation name
                        <input
                          name="organizationName"
                          required
                          maxLength={160}
                          autoComplete="organization"
                          placeholder="Registered name of the organisation"
                        />
                      </label>
                      <label>
                        Organisation type
                        <select
                          name="organizationType"
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select a type
                          </option>
                          {organizationTypeOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Registration no. / CIN (optional)
                        <input name="registrationNumber" maxLength={60} />
                      </label>
                      <label>
                        GSTIN (optional)
                        <input
                          name="gstin"
                          maxLength={15}
                          pattern="[0-9A-Za-z]{15}"
                          title="15-character GSTIN"
                        />
                      </label>
                      <label>
                        PAN (optional)
                        <input
                          name="pan"
                          maxLength={10}
                          pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
                          title="10-character PAN, for example ABCDE1234F"
                        />
                      </label>
                      <label className="join-field--full">
                        Website (optional)
                        <input
                          name="website"
                          maxLength={200}
                          inputMode="url"
                          placeholder="https://"
                        />
                      </label>
                      <label>
                        Contact person
                        <input
                          name="contactName"
                          required
                          maxLength={120}
                          autoComplete="name"
                          placeholder="Full name"
                        />
                      </label>
                      <label>
                        Contact person's designation
                        <input
                          name="contactDesignation"
                          required
                          maxLength={80}
                          placeholder="For example CSR Head"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="join-field--full">
                        Full name
                        <input
                          name="fullName"
                          required
                          maxLength={120}
                          autoComplete="name"
                          placeholder="As it should appear on your ID card"
                        />
                      </label>
                      <label>
                        Date of birth (optional)
                        <input name="dateOfBirth" type="date" max={today} />
                      </label>
                      <label>
                        Gender (optional)
                        <select name="gender" defaultValue="">
                          {genderOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="join-field--full">
                        Occupation (optional)
                        <input
                          name="occupation"
                          maxLength={120}
                          placeholder="Student, teacher, engineer…"
                        />
                      </label>
                    </>
                  )}
                  <label>
                    {isOrganization ? "Official email" : "Email"}
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={160}
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Mobile number
                    <input
                      name="phone"
                      type="tel"
                      required
                      maxLength={20}
                      pattern="\+?[0-9][0-9\s\-]{6,18}"
                      title="Phone number with country code, for example +91 98765 43210"
                      autoComplete="tel"
                      placeholder="+91"
                    />
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Address</legend>
                  <label className="join-field--full">
                    {isOrganization ? "Registered address" : "Address"}
                    <textarea
                      name="address"
                      required
                      minLength={5}
                      maxLength={300}
                      rows={2}
                      autoComplete="street-address"
                    />
                  </label>
                  <label>
                    City
                    <input
                      name="city"
                      required
                      maxLength={80}
                      autoComplete="address-level2"
                    />
                  </label>
                  <label>
                    State
                    <input
                      name="state"
                      required
                      maxLength={80}
                      autoComplete="address-level1"
                      placeholder="Haryana"
                    />
                  </label>
                  <label>
                    PIN code (optional)
                    <input
                      name="pincode"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      title="6-digit PIN code"
                      autoComplete="postal-code"
                    />
                  </label>
                </fieldset>

                <fieldset>
                  <legend>
                    {isOrganization
                      ? "How you would like to work with us"
                      : "How you would like to help"}
                  </legend>
                  {isOrganization ? (
                    <>
                      <label className="join-field--full">
                        Type of collaboration
                        <select name="collaboration" required defaultValue="">
                          <option value="" disabled>
                            Select one
                          </option>
                          {collaborationOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="join-field--full">
                        About the organisation and your proposal (optional)
                        <textarea name="about" maxLength={1500} rows={4} />
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        I would like to join as
                        <select name="joinAs" required defaultValue="">
                          <option value="" disabled>
                            Select one
                          </option>
                          {joinAsOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Availability (optional)
                        <select name="availability" defaultValue="">
                          {availabilityOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="join-field--full">
                        Skills and interests (optional)
                        <input
                          name="skills"
                          maxLength={500}
                          placeholder="Teaching, healthcare, design, events…"
                        />
                      </label>
                      <label className="join-field--full">
                        Why would you like to join? (optional)
                        <textarea name="motivation" maxLength={1500} rows={3} />
                      </label>
                    </>
                  )}
                </fieldset>

                <fieldset>
                  <legend>
                    {isOrganization ? "Organisation logo" : "Your photo"}
                  </legend>
                  <div className="join-photo join-field--full">
                    <div
                      className={`join-photo__preview ${
                        isOrganization ? "join-photo__preview--logo" : ""
                      }`}
                    >
                      {preview ? (
                        <img src={preview} alt="Selected photo preview" />
                      ) : (
                        <Icon
                          name={isOrganization ? "building" : "users"}
                          size={34}
                        />
                      )}
                    </div>
                    <div className="join-photo__control">
                      <label className="join-photo__button">
                        <Icon name="upload" size={16} />
                        {photo ? "Choose a different image" : "Choose an image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required={!photo}
                          onChange={choosePhoto}
                        />
                      </label>
                      <small>
                        {isOrganization
                          ? "A clear logo works best. JPG, PNG or WebP."
                          : "A recent, front-facing passport-style photo. JPG, PNG or WebP."}
                      </small>
                      {photoError ? (
                        <small className="join-error-text" role="alert">
                          {photoError}
                        </small>
                      ) : null}
                    </div>
                  </div>
                </fieldset>

                <label className="join-consent">
                  <input name="consent" type="checkbox" required />
                  <span>
                    I confirm these details are correct. Once approved, I agree
                    that {isOrganization ? "our name, logo" : "my name, photo"},
                    role and city may be shown on the foundation's team page and
                    ID card.
                  </span>
                </label>

                {error ? (
                  <p className="join-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  className="button button--primary join-submit"
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting ? "Sending application…" : "Submit application"}
                  <Icon name="arrow" size={17} />
                </button>
              </form>
            )}
          </section>
        </div>
      </section>
    </>
  )
}
