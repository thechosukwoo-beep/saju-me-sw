export default function ChoiceChips({
  legend,
  emoji,
  name,
  value,
  options,
  error = false,
  disabled = false,
  onChange,
}) {
  return (
    <fieldset className={`field choice ${error ? 'has-error' : ''}`} disabled={disabled}>
      <legend>
        <span className="field-emoji" aria-hidden="true">
          {emoji}
        </span>
        {legend}
      </legend>
      <div className="choice-group" role="presentation">
        {options.map((option) => (
          <label
            key={option.value}
            className={value === option.value ? 'chip is-on' : 'chip'}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
