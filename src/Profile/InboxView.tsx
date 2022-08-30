import {
    ChatNavigationHelpers,
    DialectThemeProvider,
    Inbox as DialectInbox,
    useDialectUiId,
} from '@dialectlabs/react-ui';
import { Box } from '@mui/material';
import { ClassNames } from '@emotion/react';
import { getDialectVariables, GRAPE_INBOX_ID } from '../utils/ui-contants';

export default function InboxView() {
    const { navigation } = useDialectUiId<ChatNavigationHelpers>('dialect-inbox');

    return (
        <ClassNames>
            {({ css }) => (
                <>
                    <DialectThemeProvider theme="dark" variables={getDialectVariables(css)}>
                        <Box width="100%" height={550}>
                            <DialectInbox
                                dialectId={GRAPE_INBOX_ID}
                                wrapperClassName={css({
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    fontFamily:
                                        'GrapeFont, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
                                })}
                            />
                        </Box>
                    </DialectThemeProvider>
                </>
            )}
        </ClassNames>
    );
}
