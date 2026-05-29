import * as React from "react"

type UseControllableStateParams<T> = {
  prop?: T
  defaultProp?: T
  onChange?: (state: T) => void
}

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange = () => {},
}: UseControllableStateParams<T>): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [uncontrolledProp, setUncontrolledProp] = React.useState<T | undefined>(
    defaultProp
  )
  const isControlled = prop !== undefined
  const value = isControlled ? prop : (uncontrolledProp as T)

  const handleChange = React.useCallback(
    (nextValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as Function)(value)
          : nextValue

      if (!isControlled) {
        setUncontrolledProp(resolvedValue)
      }
      onChange(resolvedValue)
    },
    [isControlled, value, onChange]
  )

  return [value, handleChange as any]
}

export default useControllableState
