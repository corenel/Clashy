import React from 'react'
import { Provider, connect } from 'react-redux'
import { store } from './store'
import Drawer from '@material-ui/core/Drawer'
import { makeStyles } from '@material-ui/core/styles'
import { SideBar, ContentPanel } from './components'
import './App.css'
import { AppBar, Toolbar, Typography } from '@material-ui/core'
import { RootState } from './store/reducers'

import { getIcon } from './utils'
import { TitleBar, WindowControls } from './components/title-bar'

import './styles/grabber.css'

const drawerWidth = 122

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: '100%',
        flex: 1
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1
        // width: 'calc(100% - 164px)', marginLeft: '164px'
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0
    },
    drawerPaper: {
        width: drawerWidth,
        border: 'none'
    },
    content: {
        flexGrow: 1,
        flex: 1,
        height: '100vh'
    }
}))

interface Props {
    currentTab: string
}

function _ClashyApp({ currentTab }: Props) {
    const classes = useStyles()
    return (
        <div>
            <div className={classes.root}>
                <AppBar position='fixed' className={classes.appBar}>
                    <TitleBar />
                    <Toolbar>
                        <div className='grabber' style={{ height: '64px', minHeight: '64px' }}>
                            {getIcon(currentTab)}
                            <Typography variant='h6'>
                                {currentTab}
                            </Typography>
                        </div>
                        <WindowControls />
                    </Toolbar>
                </AppBar>
                <Drawer
                    className={classes.drawer}
                    variant={'persistent'}
                    anchor={'left'}
                    open={true}
                    classes={{
                        paper: classes.drawerPaper
                    }}
                >
                    <SideBar />
                </Drawer>
                <main className={classes.content}>
                    <ContentPanel />
                </main>
            </div>
    </div>
    )
}

const mapState = (state: RootState) => ({
    currentTab: state.app.get('currentTab')
})

const ClashyApp = connect(mapState, null)(_ClashyApp)

class App extends React.Component {
    render() {
        return <Provider store={store}>
                  <ClashyApp />
                </Provider>
    }
}

export default App
