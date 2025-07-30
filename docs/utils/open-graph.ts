import { ImageResponse } from '@vercel/og'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function openGraph(title: string): Promise<ImageResponse> {
  let [inter, spaceGrotesk] = (await Promise.all(
    ['inter-regular', 'space-grotesk-bold'].map(
      async font =>
        await fs.readFile(
          path.join(process.cwd(), `./docs/public/fonts/${font}.ttf`),
        ),
    ),
  )) as [Buffer, Buffer]
  let logo = await fs.readFile(
    path.join(process.cwd(), './docs/public/logo.svg'),
  )
  let logoImage = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`

  return new ImageResponse(
    {
      props: {
        children: [
          {
            props: {
              children: [
                {
                  props: {
                    style: {
                      borderRadius: '0 8px 8px 0',
                      background: '#28292d',
                      display: 'flex',
                      width: '350px',
                      height: '74px',
                    },
                  },
                  type: 'div',
                },
                {
                  props: {
                    style: {
                      borderRadius: '0 8px 8px 0',
                      background: '#28292d',
                      display: 'flex',
                      width: '250px',
                      height: '74px',
                    },
                  },
                  type: 'div',
                },
                {
                  props: {
                    style: {
                      borderRadius: '0 8px 8px 0',
                      background: '#28292d',
                      display: 'flex',
                      width: '150px',
                      height: '74px',
                    },
                  },
                  type: 'div',
                },
              ],
              style: {
                alignItems: 'flex-start',
                flexDirection: 'column',
                display: 'flex',
                gap: '52px',
              },
            },
            type: 'div',
          },
          {
            props: {
              children: [
                {
                  props: {
                    height: '250px',
                    src: logoImage,
                    width: '250px',
                  },
                  type: 'img',
                },
                {
                  props: {
                    style: {
                      fontFamily: 'Space Grotesk',
                      lineHeight: '68px',
                      fontSize: '55px',
                      display: 'flex',
                      color: '#fff',
                      margin: '0',
                    },
                    children: 'Perfectionist',
                  },
                  type: 'h1',
                },
                {
                  props: {
                    style: {
                      fontFamily: 'Inter',
                      lineHeight: '36px',
                      maxWidth: '520px',
                      fontSize: '26px',
                      display: 'flex',
                      color: '#fff',
                      margin: '0',
                    },
                    children: title,
                  },
                  type: 'p',
                },
              ],
              style: {
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                display: 'flex',
              },
            },
            type: 'div',
          },
          {
            props: {
              children: [
                {
                  props: {
                    style: {
                      borderRadius: '8px 0 0 8px',
                      background: '#28292d',
                      display: 'flex',
                      width: '350px',
                      height: '74px',
                    },
                  },
                  type: 'div',
                },
                {
                  props: {
                    style: {
                      borderRadius: '8px 0 0 8px',
                      background: '#28292d',
                      display: 'flex',
                      width: '250px',
                      height: '74px',
                    },
                  },
                  type: 'div',
                },
                {
                  props: {
                    style: {
                      borderRadius: '8px 0 0 8px',
                      background: '#28292d',
                      display: 'flex',
                      width: '150px',
                      height: '74px',
                    },
                  },
                  type: 'div',
                },
              ],
              style: {
                flexDirection: 'column',
                alignItems: 'flex-end',
                display: 'flex',
                gap: '52px',
              },
            },
            type: 'div',
          },
        ],
        style: {
          justifyContent: 'space-between',
          background: '#232428',
          flexDirection: 'row',
          alignItems: 'center',
          display: 'flex',
          height: '100%',
          width: '100%',
        },
      },
      type: 'div',
    },
    {
      fonts: [
        {
          name: 'Inter',
          data: inter,
        },
        {
          name: 'Space Grotesk',
          data: spaceGrotesk,
        },
      ],
      width: 1200,
      height: 630,
    },
  )
}
