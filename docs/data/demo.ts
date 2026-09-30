import dedent from 'dedent'

export interface DemoExample {
  alphabetical: string
  lineLength: string
  initial: string
}

/**
 * Homepage demo shared by the demo block and the playground default example.
 */
export const DEMO_EXAMPLE: DemoExample = {
  alphabetical: dedent`
    import type { FC } from 'react'

    import {
      useCallback,
      useEffect,
      useId,
      useState,
    } from 'react'

    import Button from '~/components/Button'
    import Form from '~/components/Form'
    import Input from '~/components/Input'
    import { FormValues } from '~/stores/auth'

    import './style.css'

    interface Props {
      className?: string
      id: string
      onSubmit: (values: FormValues) => void
      resetFormValues: () => void
      title: string
    }

    const Auth: FC<Props> = (props) => (
      <Form {...props}>
        <Input
          full
          label="Email address"
          name="user-email"
          placeholder="Enter your email"
          type="email"
          validation={/^[^s@]+@[^s@]+.[^s@]+$/i}
        />
        <Button
          className="submit-button"
          color="secondary"
          size="l"
          type="submit"
        >
          Submit
        </Button>
      </Form>
    )
  `,
  lineLength: dedent`
    import type { FC } from 'react'

    import {
      useCallback,
      useEffect,
      useState,
      useId,
    } from 'react'

    import { FormValues } from '~/stores/auth'
    import Button from '~/components/Button'
    import Input from '~/components/Input'
    import Form from '~/components/Form'

    import './style.css'

    interface Props {
      onSubmit: (values: FormValues) => void
      resetFormValues: () => void
      className?: string
      title: string
      id: string
    }

    const Auth: FC<Props> = (props) => (
      <Form {...props}>
        <Input
          validation={/^[^s@]+@[^s@]+.[^s@]+$/i}
          placeholder="Enter your email"
          label="Email address"
          name="user-email"
          type="email"
          full
        />
        <Button
          className="submit-button"
          color="secondary"
          type="submit"
          size="l"
        >
          Submit
        </Button>
      </Form>
    )
  `,
  initial: dedent`
    import Button from '~/components/Button'
    import type { FC } from 'react'

    import {
      useId,
      useCallback,
      useState,
      useEffect,
    } from 'react'

    import Form from '~/components/Form'

    import Input from '~/components/Input'
    import { FormValues } from '~/stores/auth'
    import './style.css'

    interface Props {
      className?: string
      onSubmit: (values: FormValues) => void
      id: string
      resetFormValues: () => void
      title: string
    }

    const Auth: FC<Props> = (props) => (
      <Form {...props}>
        <Input
          placeholder="Enter your email"
          full
          name="user-email"
          validation={/^[^s@]+@[^s@]+.[^s@]+$/i}
          type="email"
          label="Email address"
        />
        <Button
          type="submit"
          className="submit-button"
          size="l"
          color="secondary"
        >
          Submit
        </Button>
      </Form>
    )
  `,
}
