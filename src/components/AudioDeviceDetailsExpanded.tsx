import React from 'react';
import {AudioDevice} from '../types/AudioDevice';
import { Box, Typography} from '@mui/material';
import HostIcon from '@mui/icons-material/Computer';
import DateIcon from '@mui/icons-material/AccessTime';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import {formatDateTimeToSQL} from '../utils/formatDate';
import {DeviceFlowType} from "../types/DeviceFlowType";
import {DeviceMessageType} from "../types/DeviceMessageType";
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import Tag from '@mui/icons-material/Tag';
import { useTheme} from '@mui/material';
import { Paper, IconButton} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import {getAudioDevicesApiUrl} from '../utils/ApiUrls';

import ConfirmDeleteDialog from './ConfirmDeleteDialog';


interface AudioDeviceDetailsExpandedProps {
    device: AudioDevice;
    onListRefreshRequested?: () => void | Promise<void>;
    onReExpandRequested?: () => void | Promise<void>;
}

const AudioDeviceDetailsExpanded: React.FC<AudioDeviceDetailsExpandedProps> = ({device, onListRefreshRequested, onReExpandRequested}) => {

    const deviceMessageTypeLabels: Record<DeviceMessageType, string> = {
        [DeviceMessageType.Confirmed]: 'Availability confirmed',
        [DeviceMessageType.Detached]: 'Device detached',
        [DeviceMessageType.Discovered]: 'Device discovered',
        [DeviceMessageType.VolumeRenderChanged]: 'Output volume updated',
        [DeviceMessageType.VolumeCaptureChanged]: 'Input volume updated',
    };

    const deviceMessageTypeToString
        = (deviceMessageType: DeviceMessageType): string =>
        deviceMessageTypeLabels[deviceMessageType] ?? 'Unknown';

    const deviceTypeToString
        = (flowType: DeviceFlowType): string => {
        switch (flowType) {
            case DeviceFlowType.RenderAndCapture:
                return 'Render-and-capture';
            case DeviceFlowType.Capture:
                return 'Capture';
            case DeviceFlowType.Render:
                return 'Render';
            default:
                return 'Unknown';
        }
    };

    const theme = useTheme();

    const [isDeletePending, setIsDeletePending] = React.useState(false);
    const refreshTimeoutRef = React.useRef<number | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    React.useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current !== null) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, []);

    const handleRefresh = async (deviceKey: string) => {
        if (isDeletePending) return;

        try {
            const response = await axios.get(`${getAudioDevicesApiUrl()}/${deviceKey}`);
            console.log('Refresh successful:', response.data);

            await onListRefreshRequested?.();
            await onReExpandRequested?.();
        } catch (error) {
            console.error('Error refreshing device:', error);
        }
    };

    const handleDelete = async (deviceKey: string) => {
        if (isDeletePending) return;

        setIsDeleteDialogOpen(false);
        setIsDeletePending(true);
        try {
            const response = await axios.delete(`${getAudioDevicesApiUrl()}/${deviceKey}`);
            console.log('Delete successful:', response.data);

            refreshTimeoutRef.current = window.setTimeout(() => {
                void Promise.resolve(onListRefreshRequested?.()).finally(() => {
                    setIsDeletePending(false);
                });
            }, 500);
        } catch (error) {
            console.error('Error deleting device:', error);
            setIsDeletePending(false);
        }
    };

    const openDeleteDialog = () => {
        if (isDeletePending) return;
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        if (isDeletePending) return;
        setIsDeleteDialogOpen(false);
    };

    return (
        <Box>
            <Box
                sx={{
                    paddingLeft: '1.5rem'
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 1}}>
                    <LabelOutlined fontSize="small"/>
                    <Typography variant="body1" sx={{fontSize: '0.9rem', lineHeight: '1.1rem'}}>
                        {deviceTypeToString(device.flowType)}
                        {' device: '}
                        {device.name}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 1}}>
                    <Tag fontSize="small"/>
                    <Typography variant="body1" sx={{fontSize: '0.9rem', lineHeight: '1.1rem'}}>
                        {' PnP Id: '}
                        {device.pnpId}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 1}}>
                    <HostIcon fontSize="small"/>
                    <Typography variant="body1" sx={{fontSize: '0.9rem', lineHeight: '1.1rem'}}>
                        {' End point: '}
                        {device.hostName}
                        {' (hashed)'}
                        {device.operationSystemName &&
                            device.operationSystemName !== '' &&
                            `, ${device.operationSystemName}`}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 1}}>
                    <DateIcon fontSize="small"/>
                    <Typography variant="body1" sx={{fontSize: '0.9rem', lineHeight: '1.1rem'}}>
                        {formatDateTimeToSQL(device.updateDate)}
                        {': '}
                        {deviceMessageTypeToString(device.deviceMessageType)}
                    </Typography>
                </Box>
                {
                    (device.flowType === DeviceFlowType.RenderAndCapture || device.flowType === DeviceFlowType.Render) &&
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1}}>
                        <VolumeUpIcon fontSize="small"/>
                        <Typography variant="body1" sx={{fontSize: '0.9rem', lineHeight: '1.1rem'}}>
                            {' Output volume: '}
                            {device.renderVolume / 10}
                            %
                        </Typography>
                    </Box>
                }
                {
                    (device.flowType === DeviceFlowType.RenderAndCapture || device.flowType === DeviceFlowType.Capture) &&
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1}}>
                        <MicOutlinedIcon fontSize="small"/>
                        <Typography variant="body1" sx={{fontSize: '0.9rem', lineHeight: '1.1rem'}}>
                            {' Input volume: '}
                            {device.captureVolume / 10}
                            %
                        </Typography>
                    </Box>
                }
            </Box>
            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                title="Delete device?"
                description={`This will permanently delete “${device.name}”.`}
                isPending={isDeletePending}
                onCancel={closeDeleteDialog}
                onConfirm={() => handleDelete(device.key)}
            />
            {
                <Box
                    sx={{
                        paddingLeft: '0.0rem'
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: '0.5rem',
                            py: '0.25rem',
                            borderRadius: '16px',
                            width: 'fit-content',
                            border: `1.6px solid ${theme.palette.divider}`,
                            transition: 'border-color 0.2s',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000',
                            },
                        }}
                    >
                        <IconButton size="small" disabled={isDeletePending} onClick={() => handleRefresh(device.key)}>
                            <RefreshIcon fontSize="small"/>
                        </IconButton>
                        <IconButton size="small" disabled={isDeletePending} onClick={openDeleteDialog}>
                            <DeleteIcon fontSize="small"/>
                        </IconButton>
                    </Paper>
                </Box>
            }

        </Box>
    );
};

export default AudioDeviceDetailsExpanded;

