import React from 'react'
import { isWindows, isLinux, isMac } from '../../utils'
import ic_minimum from '../../assets/minimum.png'
import ic_close from '../../assets/close.png'

import './title-bar.css'
import { callIPC } from '../../native-support/message-queue'
import { BRG_MSG_CLS_WIN, BRG_MSG_MIN_WIN } from '../../native-support/message-constants'

type Props = {
    title?: string
}

function titleBar(props: Props) {
    if (!isMac()) {
        return null
    }
    return (
        <div className='title-bar-wrapper' >
            <div className='title-bar-content'>
                {
                    props.title ? <p>{props.title}</p> : null
                }
            </div>
        </div>
    )
}

function controls() {
    if (isMac()) {
        return null
    }
    return (
        <div className='title-bar-controls'>
            <div className='button hover-trans' onClick={minimumWindow}>
                <img src={ic_minimum} />
            </div>
            <div className='button hover-red' onClick={closeWindow}>
                <img src={ic_close} />
            </div>
        </div>
    )
}

function closeWindow() {
    callIPC(BRG_MSG_CLS_WIN, {})
}

function minimumWindow() {
    callIPC(BRG_MSG_MIN_WIN, {})
}

export const WindowControls = controls

export const TitleBar = titleBar