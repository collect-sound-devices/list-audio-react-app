'use client';

import React, {useState, useMemo} from 'react';
import {
    List,
    Typography,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    SelectChangeEvent
} from '@mui/material';
import SpeakerGroupOutlinedIcon from '@mui/icons-material/SpeakerGroupOutlined';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import SpeakerOutlinedIcon from '@mui/icons-material/SpeakerOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {formatDateToSQL} from '../utils/formatDate';
import AudioDeviceDetailsExpanded from './AudioDeviceDetailsExpanded';
import {AudioDevice} from '../types/AudioDevice';
import {DeviceFlowType} from "../types/DeviceFlowType";
import {accordionStyle, accordionSummaryStyle} from "../styles/accordionStyles";
import SortAndSearchAccordion from './SortAndSearchAccordion';
import {ellipsisTextStyle, getFlexStylePercent} from "../styles/listStyles";

const getSavedSearchQuery = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('appliedSearchQuery') ?? '';
};

interface AudioDeviceListProps {
    audioDevices: AudioDevice[];
    onSearch: (query: string) => void;
    onRefreshListRequested?: () => void | Promise<void>;
    onExpandRequested: (deviceKey: string | false) => void;
    expandedKey: string | false;
    onReExpandRequested?: (deviceKey: string) => void | Promise<void>;
}

const AudioDeviceList: React.FC<AudioDeviceListProps> = ({
                                                             audioDevices,
                                                             onSearch,
                                                             onRefreshListRequested,
                                                             onExpandRequested,
                                                             expandedKey,
                                                             onReExpandRequested
                                                         }) => {
    const [sortField, setSortField] = useState<keyof AudioDevice>('updateDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [searchQuery, setSearchQuery] = useState(getSavedSearchQuery);

    // Controlled expansion: parent owns expandedKey; we only request changes.
    const expanded = expandedKey;

    const theme = useTheme();

    const sortedDevices = useMemo(() => {
        return [...audioDevices].sort((a, b) => {
            const aValue = String(a[sortField]).toLowerCase();
            const bValue = String(b[sortField]).toLowerCase();
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
    }, [audioDevices, sortField, sortDirection]);

    const handleSortFieldChange = (e: SelectChangeEvent) => {
        setSortField(e.target.value as keyof AudioDevice);
    };

    const toggleSortDirection = () => {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const handleSearch = () => {
        onSearch(searchQuery);
        localStorage.setItem('appliedSearchQuery', searchQuery);
    };

    const clearSearch = () => {
        setSearchQuery('');
        onSearch('');
        localStorage.removeItem('appliedSearchQuery');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        const next = isExpanded ? panel : false;
        onExpandRequested(next);
    };

    return (
        <Box sx={{flexGrow: 1, paddingTop: '0.1rem'}}>
            <SortAndSearchAccordion
                clearSearch={clearSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleKeyDown={handleKeyDown}
                sortDirection={sortDirection}
                toggleSortDirection={toggleSortDirection}
                sortField={sortField}
                handleSortFieldChange={handleSortFieldChange}
            />

            <List>
            {sortedDevices.map((device) => (
                    <Accordion
                        key={device.key}
                        expanded={expanded === device.key}
                        onChange={handleAccordionChange(device.key)}
                        sx={accordionStyle}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            sx={accordionSummaryStyle(theme)}
                        >
                            <Box sx={{display: 'flex', columnGap: 1, width: '100%', alignItems: 'center'}}>
                                <Box
                                    sx={getFlexStylePercent(50)}
                                >
                                    {device.flowType === DeviceFlowType.RenderAndCapture ? (
                                        <SpeakerGroupOutlinedIcon fontSize="medium" />
                                    ) : device.flowType === DeviceFlowType.Capture ? (
                                        <MicOutlinedIcon fontSize="medium" />
                                    ) : ( // Render
                                        <SpeakerOutlinedIcon fontSize="medium" />
                                    )}
                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={ellipsisTextStyle}
                                    >
                                        {device.name}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{...getFlexStylePercent(40), minWidth: '6.6rem'}}
                                >
                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={ellipsisTextStyle}
                                    >
                                        {device.hostName}
                                        {device.operationSystemName &&
                                            device.operationSystemName !== '' &&
                                            `, ${device.operationSystemName}`}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{...getFlexStylePercent(10), minWidth: '4.8rem'}}
                                >
                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={ellipsisTextStyle}
                                    >
                                        {formatDateToSQL(device.updateDate)}
                                    </Typography>
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails
                            sx={{
                                paddingTop: '0.3rem',
                                paddingBottom: '0.3rem',
                                paddingLeft: 1.3
                            }}
                        >
                            <AudioDeviceDetailsExpanded
                                device={device}
                                onListRefreshRequested={onRefreshListRequested}
                                onReExpandRequested={onReExpandRequested ? () => onReExpandRequested(device.key) : undefined}
                            />
                        </AccordionDetails>
                    </Accordion>
                ))}
            </List>
        </Box>
    );
};

export default AudioDeviceList;
