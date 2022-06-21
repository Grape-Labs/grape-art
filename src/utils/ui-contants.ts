import { ClassNamesContent } from '@emotion/react';
import { defaultVariables, IncomingThemeVariables } from '@dialectlabs/react-ui';

export const GRAPE_BOTTOM_CHAT_ID = 'grape-bottom-chat';
export const GRAPE_INBOX_ID = 'grape-inbox';

export const getDialectVariables = (
    css: ClassNamesContent['css'],
    type: 'popup' | 'inbox' = 'inbox'
): IncomingThemeVariables => ({
    dark: {
        colors: {
            bg: css({ backgroundColor: type === 'inbox' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(45, 21, 53, 0.96)' }),
            highlightSolid: css({
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                svg: { marginTop: '2px' }, // small hack to move down Dialect logo in Powered by
            }),
        },
        slider: css({
            width: '100%',
            height: '100%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            fontFamily:
                'GrapeFont, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        }),
        textStyles: {
            header: type === 'inbox' ? css({ fontSize: 16, fontWeight: 800 }) : css({ fontSize: 18, fontWeight: 400 }),
        },
        header: `${defaultVariables.dark.header} dt-border-neutral-600`,
        outlinedInput: `${defaultVariables.dark.outlinedInput} ${css({
            fontFamily: 'inherit',
            borderColor: '#818791',
        })} ${css`
            ::placeholder {
                color: #ffffff;
            }
        `}`,
        textArea: `${defaultVariables.dark.textArea} ${css({
            fontFamily: 'inherit',
            backgroundColor: 'transparent', // solid bg of tabs background (without opacity)
            borderColor: '#818791',
        })} ${css`
            ::placeholder {
                color: #ffffff;
            }
        `}`,
        messageBubble: `${defaultVariables.dark.messageBubble} ${css({ borderColor: 'rgba(255, 255, 255, 1)' })}`,
        otherMessageBubble: `${defaultVariables.dark.otherMessageBubble} ${css({
            borderColor: 'rgba(255, 255, 255, 1)',
            backgroundColor: 'transparent',
        })}`,
    },
});
