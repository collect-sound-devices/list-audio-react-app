'use client';

import React, { useState, useEffect } from 'react';
import { AudioDevice } from '../types/AudioDevice';
import AudioDeviceList from './AudioDeviceList';
import {Box, Alert, Accordion, AccordionSummary, AccordionDetails, Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import LoadingComponent from './LoadingComponent';
import { AudioDeviceFetchService } from '../services/AudioDeviceFetchService';

const AudioDeviceListComponent: React.FC = () => {
    const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedKey, setExpandedKey] = useState<string | false>(false);
    const [pendingExpandKey, setPendingExpandKey] = useState<string | null>(null);
    const { t: translate } = useTranslation();

    const createAudioDeviceFetchService = React.useCallback(() => new AudioDeviceFetchService(
        ({ progress: p, error: e }) => {
            setProgress(p);
            setError(e);
        },
        (key: string) => translate(key)
    ), [translate]);

    const refetchDevices = React.useCallback(async (queryOverride?: string) => {
        const query = queryOverride ?? searchQuery;

        const service = createAudioDeviceFetchService();

        setLoading(true);
        setError(null);
        try {
            const fetchFn = query
                ? service.searchAudioDevices.bind(service)
                : service.fetchAudioDevices.bind(service);
            const devices = await fetchFn(query);
            setAudioDevices(devices);

            if (expandedKey && !devices.some(d => d.key === expandedKey)) {
                setExpandedKey(false);
            }

            // If re-expand requested (after refresh), expand it only if it still exists.
            if (pendingExpandKey) {
                setExpandedKey(devices.some(d => d.key === pendingExpandKey) ? pendingExpandKey : false);
                setPendingExpandKey(null);
            }
        } finally {
            setLoading(false);
        }
    }, [createAudioDeviceFetchService, searchQuery, expandedKey, pendingExpandKey]);

    const requestExpandAfterRefresh = React.useCallback(async (deviceKey: string) => {
        setPendingExpandKey(deviceKey);
        await refetchDevices();
    }, [refetchDevices]);

    useEffect(() => {
        const savedQuery = localStorage.getItem('appliedSearchQuery');
        if (savedQuery) {
            setSearchQuery(savedQuery);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const service = new AudioDeviceFetchService(
            ({ progress: p, error: e }) => {
                if (!cancelled) {
                    setProgress(p);
                    setError(e);
                }
            },
            (key: string) => translate(key)
        );

        const run = async (query: string) => {
            setLoading(true);
            setError(null);
            try {
                console.info(`Starting query, next.js server part: ${query}`);

                const fetchFn = query
                    ? service.searchAudioDevices.bind(service)
                    : service.fetchAudioDevices.bind(service);
                const devices = await fetchFn(query);
                if (!cancelled) setAudioDevices(devices);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        console.info(`Starting query, client part: ${searchQuery}`);
        void run(searchQuery);
        return () => { cancelled = true; };
    }, [searchQuery, translate]);

    const handleSearch = (query: string) => setSearchQuery(query);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            gap: 1, paddingTop: 1
        }}>
            <Box>
                <Accordion
                    sx={{
                        fontSize: '0.8rem',
                        padding: 0,
                        boxShadow: 'none',
                        border: 'none',
                        '&:before': {display: 'none'}
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            paddingLeft: 1,
                            '.MuiAccordionSummary-content': {
                                margin: '0.3rem 0'
                            },
                            '& .MuiAccordionSummary-expandIconWrapper': {
                                order: -1,
                            }
                        }}
                    >
                        <Typography sx={{ fontSize: 'inherit' }}>
                            About a list of collected audio devices
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails
                        sx={{
                            fontSize: 'inherit',
                            paddingTop: '0.3rem',
                            paddingBottom: '0.3rem',
                            paddingLeft: 1.3
                        }}
                    >
                        <Typography sx={{ fontSize: 'inherit' }}>
                            This repository shows a list of audio devices that were collected on connected hosts.<br />
                            The application is built using React (Next.js + TypeScript).<br />
                            The server part is implemented as ASP.Net Core Web API with MongoDB as a database.<br />
                            NOTE: Initializing could delay due to the infrastructure starting process.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                {loading ? (
                    <LoadingComponent progress={progress} error={error} />
                ) : error ? (
                    <Alert severity="info" sx={{ mt: 1 }}>{error}</Alert>
                ) : (
                    <AudioDeviceList
                        audioDevices={audioDevices}
                        onSearch={handleSearch}
                        onRefreshListRequested={refetchDevices}
                        expandedKey={expandedKey}
                        onExpandRequested={setExpandedKey}
                        onReExpandRequested={requestExpandAfterRefresh}
                    />
                )}
            </Box>
        </Box>
    );
};

export default AudioDeviceListComponent;