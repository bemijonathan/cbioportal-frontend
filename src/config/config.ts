import {IAppConfig, IServerConfig, PriorityStudies} from "./IAppConfig";
import getBrowserWindow from "../shared/lib/getBrowserWindow";
import * as _ from "lodash";
import ServerConfigDefaults from "./serverConfigDefaults";
import memoize from "memoize-weak-decorator";

import {
    getCbioPortalApiUrl,
    getConfigurationServiceApiUrl, getG2SApiUrl,
    getGenomeNexusApiUrl,
    getOncoKbApiUrl, trimTrailingSlash
} from "../shared/api/urls";

import civicClient from "../shared/api/civicClientInstance";
import genomeNexusClient from '../shared/api/genomeNexusClientInstance';
import internalGenomeNexusClient from '../shared/api/genomeNexusInternalClientInstance';
import oncoKBClient from '../shared/api/oncokbClientInstance';
import genome2StructureClient from '../shared/api/g2sClientInstance';
import client from "../shared/api/cbioportalClientInstance";
import internalClient from "../shared/api/cbioportalInternalClientInstance";
import {proxyAllPostMethodsOnClient} from "../shared/lib/proxyPost";
import CBioPortalAPI from "../shared/api/generated/CBioPortalAPI";
import CBioPortalAPIInternal from "../shared/api/generated/CBioPortalAPIInternal";
import CivicAPI from "../shared/api/CivicAPI";
import Genome2StructureAPI from "../shared/api/generated/Genome2StructureAPI";
import GenomeNexusAPI from "../shared/api/generated/GenomeNexusAPI";
import GenomeNexusAPIInternal from "../shared/api/generated/GenomeNexusAPIInternal";
import OncoKbAPI from "../shared/api/generated/OncoKbAPI";
import sessionServiceAPI from "../shared/api/sessionServiceAPI";


const config:any = (window as any).frontendConfig || { serverConfig:{} };

const win = (window as any);

export default config;

export function updateConfig(obj:Partial<IAppConfig>){

    // handle serverConfig
    if (obj.serverConfig) {
        setServerConfig(obj.serverConfig);
        delete obj.serverConfig;
    }

    // first construct the new object, but DEFERRING TO THE OLD PROPERTIES
    const nextConfig = Object.assign({}, obj, config);

    // now we have to overwrite AppConfig props
    // NOTE: we cannot put AppConfig as target of above assign because
    // assignment proceeds left to right and the original AppConfig that's the last param will be overwritten
    // so we have to copy

    // WE CANNOT REPLACE REFERENCE
    // we have to use assign here (as opposed to replacing the reference because importers
    // already have reference and those will become detached from this
    Object.assign(config, nextConfig);

}

export function setServerConfig(serverConfig:{[key:string]:any }){

    _.each(ServerConfigDefaults,(defaultVal,key)=>{

        //if we know the prop default is boolean
        //set config to default val IF the configuration value is NOT boolean
        //this handles null or empty string values on boolean props
        //we do not want to allow this for string values, for which empty string or null is valid value
        if (_.isBoolean(defaultVal)){
            if (!_.isBoolean(serverConfig[key])) {
                serverConfig[key] = defaultVal;
            }
        } else {
            // for non booleans, only resolve to default if prop is missing or null
            if (!serverConfig.hasOwnProperty(key) || serverConfig[key] === null) {
                serverConfig[key] = defaultVal;
            }
        }

    });

    const frontendOverride = (serverConfig.frontendConfigOverride) ? JSON.parse(serverConfig.frontendConfigOverride) : {}

    // allow any hardcoded serverConfig props to override those from service
    const mergedConfig = Object.assign({}, serverConfig, frontendOverride , config.serverConfig || {})

    config.serverConfig = mergedConfig;


}


export class ServerConfigHelpers {

    @memoize static skin_example_study_queries(str:string){
        const matches = str.match(/.+/g);
        return (matches) ? matches.map((s:string)=>s.trim()) : [];
    }

    @memoize static priority_studies(str:string|null): PriorityStudies{
        if (str && str.length) {
            return _.chain(str)
                .split(";").map((s)=>s.split("#")).fromPairs().mapValues((s)=>s.split(",")).value();
        } else {
            return {}
        }
    }

    @memoize static parseQuerySetsOfGenes(json:string){
        try {
            return JSON.parse(json);
        } catch (ex) {
            throw("Cannot parse query_sets_of_genes json");
        } finally {
            return null;
        }
    }

    @memoize static parseDisabledTabs(str:string){
        return str.split(",").map((s)=>s.trim());
    }


    static sessionServiceIsEnabled(){
        return !_.isEmpty(config.serverConfig.session_service_url);
    }

    static getUserEmailAddress() : string | undefined {
        return (config.serverConfig.user_email_address && config.serverConfig.user_email_address !== "anonymousUser") ?
            config.serverConfig.user_email_address : undefined;
    }

};

export function initializeAPIClients(){

    // we need to set the domain of our api clients
    (client as any).domain = getCbioPortalApiUrl();
    (internalClient as any).domain = getCbioPortalApiUrl();
    (genomeNexusClient as any).domain = getGenomeNexusApiUrl();
    (internalGenomeNexusClient as any).domain = getGenomeNexusApiUrl();
    (oncoKBClient as any).domain = getOncoKbApiUrl();
    (genome2StructureClient as any).domain = getG2SApiUrl();

    // add POST caching
    proxyAllPostMethodsOnClient(CBioPortalAPI);
    proxyAllPostMethodsOnClient(CBioPortalAPIInternal);
    proxyAllPostMethodsOnClient(CivicAPI);
    proxyAllPostMethodsOnClient(Genome2StructureAPI);
    proxyAllPostMethodsOnClient(GenomeNexusAPI);
    proxyAllPostMethodsOnClient(GenomeNexusAPIInternal);
    proxyAllPostMethodsOnClient(OncoKbAPI);
    proxyAllPostMethodsOnClient(sessionServiceAPI);
}

export function initializeConfiguration(){
    // @ts-ignore: ENV_* are defined in webpack.config.js

    // handle localStorage
    // LOCAL STORAGE TRUMPS EVERYTHING EXCEPT WHAT'S ORIGINALLY SET IN JSP
    if (localStorage.frontendConfig) {
        try {
            updateConfig(JSON.parse(localStorage.frontendConfig));
            console.log("Using localStorage.frontendConfig (overriding window.frontendConfig): " + localStorage.frontendConfig);
        } catch (err) {
            // ignore
            console.log("Error parsing localStorage.frontendConfig")
        }
    }

    // @ts-ignore: ENV_* are defined in webpack.config.js
    const APIROOT = `//${trimTrailingSlash(ENV_CBIOPORTAL_URL)}/`;

    // we want to respect frontUrl if it is already set (case where localdist is true)
    // @ts-ignore: ENV_* are defined in webpack.config.js
    const frontendUrl = config.frontendUrl || (/\/\/localhost:3000/.test(win.location.href)) ? "//localhost:3000/" : `//${ENV_CBIOPORTAL_URL}/`;

    const configServiceUrl = config.configurationServiceUrl || APIROOT;

    const envConfig: Partial<IAppConfig> = {
        apiRoot:APIROOT,
        frontendUrl:frontendUrl
    };

    updateConfig(envConfig);

    // @ts-ignore: ENV_* are defined in webpack.config.js
    if (ENV_GENOME_NEXUS_URL) {
        if (!config.serverConfig) config.serverConfig = {};
        // @ts-ignore: ENV_* are defined in webpack.config.js
        config.serverConfig.genomenexus_url = `//${trimTrailingSlash(ENV_GENOME_NEXUS_URL)}/`;
    }

}
