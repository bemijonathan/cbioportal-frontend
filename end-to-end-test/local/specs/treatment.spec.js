const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    waitForPlotsTab,
    reactSelectOption,
    selectReactSelectOption,
    selectElementByText,
    clickElement,
    getElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';
const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize&generic_assay_groups=study_es_0_treatment_ic50,Afatinib-1,Afatinib-2';
const ADD_TRACKS_TREATMENT_TAB =
    '.oncoprintAddTracks a.tabAnchor_TREATMENT_RESPONSE';
const TREATMENT_IC50_PROFILE_NAME =
    'IC50 values of compounds on cellular phenotype readout';
const TREATMENT_EC50_PROFILE_NAME =
    'EC50 values of compounds on cellular phenotype readout';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';

describe('treatment feature', function() {
    //this.retries(2);

    describe('oncoprint tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
        });

        it('shows treatment data type option in heatmap menu', async () => {
            await goToTreatmentTab();
            // open treatment profile selection menu
            $(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            selectElementByText(TREATMENT_IC50_PROFILE_NAME).waitForExist();
            assert($(`//*[text()="${TREATMENT_IC50_PROFILE_NAME}"]`));
            selectElementByText(TREATMENT_EC50_PROFILE_NAME).waitForExist();
            assert($(`//*[text()="${TREATMENT_EC50_PROFILE_NAME}"]`));
        });

        it('shows treatment selection box in heatmap menu when treatment data type is selected', async () => {
            await goToTreatmentTab();
            // change profile to IC50
            $(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            selectElementByText(TREATMENT_IC50_PROFILE_NAME).waitForExist();
            selectElementByText(TREATMENT_IC50_PROFILE_NAME).click();
            assert($(`//*[text()="${TREATMENT_IC50_PROFILE_NAME}"]`));
            // change profile to EC50
            $(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            selectElementByText(TREATMENT_EC50_PROFILE_NAME).waitForExist();
            selectElementByText(TREATMENT_EC50_PROFILE_NAME).click();
            assert($(`//*[text()="${TREATMENT_EC50_PROFILE_NAME}"]`));
        });

        it('shows all treatments in generic assay selector', async () => {
            await goToTreatmentTab();
            // open entity dropdown menu
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            const options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            assert.equal(options.length, 10);
        });

        it('select one treatment in generic assay selector', async () => {
            await goToTreatmentTab();
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            $('[data-test="GenericAssayEntitySelection"] input').setValue(
                '17-AAG'
            );
            const options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            options[1].click();
            $(GENERIC_ASSAY_ENTITY_SELECTOR)
                .$('div[class$="multiValue"]')
                .waitForExist();
            const selectedOptions = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="multiValue"]'
            );
            assert.equal(selectedOptions.length, 1);
        });

        it('show multiple filtered treatments', async () => {
            await goToTreatmentTab();
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            $('[data-test="GenericAssayEntitySelection"] input').setValue(
                'AZD'
            );
            const options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            assert.equal(options.length, 3);
        });

        it('select multiple filtered treatments in generic assay selector', async () => {
            await goToTreatmentTab();
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            $('[data-test="GenericAssayEntitySelection"] input').setValue(
                'AZD'
            );
            const options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            options[0].click();
            $('div[class$="multiValue"]').waitForExist();
            const selectedOptions = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="multiValue"]'
            );
            assert.equal(selectedOptions.length, 2);
        });

        it('keeps the filtered treatments list open after selecting an option', async () => {
            await goToTreatmentTab();
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            const options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            assert.equal(options.length, 10);

            options[0].click();
            options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            assert.equal(options.length, 9);
        });

        it('initializes from `generic_assay_groups` URL parameter', async () => {
            await goToUrlAndSetLocalStorage(
                oncoprintTabUrl.concat(
                    '&generic_assay_groups=study_es_0_treatment_ic50,17-AAG'
                ),
                true
            );
            await waitForOncoprint();
            await goToTreatmentTab();
            $(GENERIC_ASSAY_ENTITY_SELECTOR)
                .$('div[class$="multiValue"]')
                .waitForExist();
            const selectedOptions = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="multiValue"]'
            );
            assert.equal(selectedOptions.length, 1);
            assert.equal(
                selectedOptions[0].getText(),
                'Name of 17-AAG (17-AAG): Desc of 17-AAG'
            );
        });

        it('sets `generic_assay_groups` URL parameter', async () => {
            await goToTreatmentTab();
            // Select treatment profile
            $(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            selectElementByText(TREATMENT_EC50_PROFILE_NAME).waitForExist();
            selectElementByText(TREATMENT_EC50_PROFILE_NAME).click();

            // Select treatments
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            $('[data-test="GenericAssayEntitySelection"] input').setValue(
                '17-AAG'
            );
            const options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            options[0].click();
            const indicators = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="indicatorContainer"]'
            );
            // close the dropdown
            indicators[0].click();
            const selectedOptions = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="multiValue"]'
            );
            assert.equal(selectedOptions.length, 1);

            $('button=Add Track').click();
            await waitForOncoprint();
            const url = browser.getUrl();

            const regex = /generic_assay_groups=study_es_0_treatment_ec50%2C17-AAG/;
            assert(url.match(regex));
        });
    });

    describe('plots tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(plotsTabUrl, true);
            waitForPlotsTab();
        });

        it('shows treatment option in horizontal data type selection box', async () => {
            const select = $('[name=h-profile-type-selector]').$('..');
            assert(reactSelectOption(select, 'Treatment Response'));
        });

        it('shows treatment option in vertical data type selection box', async () => {
            const select = $('[name=v-profile-type-selector]').$('..');
            assert(reactSelectOption(select, 'Treatment Response'));
        });

        it('horizontal axis menu shows treatments in profile menu', async () => {
            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = $('[name=h-profile-name-selector]').$(
                '..'
            );
            assert(
                reactSelectOption(
                    horzProfileSelect,
                    'EC50 values of compounds on cellular phenotype readout'
                )
            );
            assert(
                reactSelectOption(
                    horzProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                )
            );
        });

        it('vertical axis menu shows treatments in profile menu', async () => {
            const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = $('[name=v-profile-name-selector]').$(
                '..'
            );
            assert(
                reactSelectOption(
                    vertProfileSelect,
                    'EC50 values of compounds on cellular phenotype readout'
                )
            );
            assert(
                reactSelectOption(
                    vertProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                )
            );
        });

        it('horizontal axis menu shows treatment entry in entity menu', async () => {
            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = $('[name=h-profile-name-selector]').$(
                '..'
            );
            selectReactSelectOption(
                horzProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            $('[data-test=generic-assay-info-icon]').waitForExist();

            // NOT SUPER CLEAR WHY THESE ARE NECESSARY
            browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: '17-AAG',
                    label: 'Name of 17-AAG',
                });
            });

            browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });
        });

        it('vertical axis menu shows treatment entry in entity menu', async () => {
            const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = $('[name=v-profile-name-selector]').$(
                '..'
            );
            selectReactSelectOption(
                vertProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            $('[data-test=generic-assay-info-icon]').waitForExist();

            // browser.execute(function() {
            //     resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            //         value: '17-AAG',
            //         label: 'Name of 17-AAG',
            //     });
            // })
            //
            //
            // browser.execute(function() {
            //     resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            //         value: 'AEW541',
            //         label: 'Name of AEW541',
            //     });
            // })
        });

        it('has Ordered samples entry in vert. menu when treatment selected on horz. axis', async () => {
            const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = $('[name=v-profile-name-selector]').$(
                '..'
            );
            selectReactSelectOption(
                vertProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            $('[data-test=generic-assay-info-icon]').waitForExist();

            browser.execute(function() {
                resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });

            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            assert(reactSelectOption(horzDataSelect, 'Ordered samples'));
        });

        it('has `Ordered samples` entry in horz. menu when treatment selected on vert. axis', async () => {
            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = $('[name=h-profile-name-selector]').$(
                '..'
            );
            selectReactSelectOption(
                horzProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            $('[data-test=generic-assay-info-icon]').waitForExist();

            browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });

            const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            assert(reactSelectOption(vertDataSelect, 'Ordered samples'));
        });

        it('shows `Log Scale` checkbox when treatment selected on vert. axis', async () => {
            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Treatment Response');
            assert($('[data-test=HorizontalLogCheckbox]'));
        });

        it('shows `Log Scale` checkbox when treatment selected on horz. axis', async () => {
            const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            selectReactSelectOption(vertDataSelect, 'Treatment Response');
            assert($('[data-test=VerticalLogCheckbox]'));
        });

        it('shows checkbox for limit values (e.g., larger_than_8.00) checkbox when such profile selected on horz. axis', async () => {
            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = $('[name=h-profile-name-selector]').$(
                '..'
            );
            selectReactSelectOption(
                horzProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );

            $('[data-test=generic-assay-info-icon]').waitForExist({
                timeout: 10000,
            });

            // WHY WAS ASSERT BEING CALLED ON THIS?
            browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });
            // browser.pause(1000);

            $('[data-test=ViewLimitValues]').waitForExist();
            assert($('[data-test=ViewLimitValues]').isDisplayed());
        });

        it('shows checkbox for limit values (e.g., larger_than_8.00) checkbox when such profile selected on vert. axis', async () => {
            const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = $('[name=v-profile-name-selector]').$(
                '..'
            );
            selectReactSelectOption(
                vertProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );
            $('[data-test=generic-assay-info-icon]').waitForExist({
                timeout: 10000,
            });

            browser.execute(function() {
                resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });

            $('[data-test=ViewLimitValues]').waitForExist();
            assert($('[data-test=ViewLimitValues]').isDisplayed());
        });

        it('shows hint for handling of threshold values for treatment data in scatter plot', async () => {
            assert($('label=Value >8.00 Labels **'));
            assert($('div*=** '));
        });

        it('shows gene selection box in utilities menu for waterfall plot', async () => {
            selectTreamentsBothAxes();

            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');
            assert($('.gene-select-container'));
            assert($('.gene-select-container'));
        });

        it('shows selected genes in gene selection box in utilities menu for waterfall plot', async () => {
            selectTreamentsBothAxes();

            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            $('.gene-select-container').waitForExist();
            const geneSelect = $('.gene-select-container');

            geneSelect.click();
            $('[data-test=GeneColoringMenu]')
                .$('div=Genes')
                .waitForDisplayed();

            // select gene menu entries
            const geneMenuEntries = $('[data-test=GeneColoringMenu]')
                .$('div=Genes')
                .$('..')
                .$$('div')[1]
                .$$('div');

            assert.strictEqual(geneMenuEntries[0].getText(), 'CDKN2A');
            assert.strictEqual(geneMenuEntries[1].getText(), 'MDM2');
            assert.strictEqual(geneMenuEntries[2].getText(), 'MDM4');
            assert.strictEqual(geneMenuEntries[3].getText(), 'TP53');
        });

        it('shows sort order button for waterfall plot when `Ordered samples` selected', async () => {
            selectTreamentsBothAxes();
            const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');
            assert($('[data-test=changeSortOrderButton'));
        });
    });
});

const goToTreatmentTab = async () => {
    await clickElement('button[id=addTracksDropdown]');
    await getElement(ADD_TRACKS_TREATMENT_TAB, {
        waitForExist: true,
    });
    await clickElement(ADD_TRACKS_TREATMENT_TAB);
};

const selectTreamentsBothAxes = () => {
    const horzDataSelect = $('[name=h-profile-type-selector]').$('..');
    selectReactSelectOption(horzDataSelect, 'Treatment Response');
    const horzProfileSelect = $('[name=h-profile-name-selector]').$('..');
    selectReactSelectOption(
        horzProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    const vertDataSelect = $('[name=v-profile-type-selector]').$('..');
    selectReactSelectOption(vertDataSelect, 'Treatment Response');
    const vertProfileSelect = $('[name=v-profile-name-selector]').$('..');
    selectReactSelectOption(
        vertProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    $('[data-test=generic-assay-info-icon]').waitForExist();
    browser.execute(function() {
        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    browser.execute(function() {
        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    $('[data-test=ViewLimitValues]').waitForExist();
    if (!$('[data-test=ViewLimitValues]').isSelected()) {
        $('[data-test=ViewLimitValues]').click();
    }

    if ($('[data-test=HorizontalLogCheckbox]').isSelected()) {
        $('[data-test=HorizontalLogCheckbox]').click();
    }

    if ($('[data-test=VerticalLogCheckbox]').isSelected()) {
        $('[data-test=VerticalLogCheckbox]').click();
    }
};

module.exports = {
    oncoprintTabUrl: oncoprintTabUrl,
    goToTreatmentTab: goToTreatmentTab,
    queryPageUrl: CBIOPORTAL_URL,
    plotsTabUrl: plotsTabUrl,
    selectTreamentsBothAxes: selectTreamentsBothAxes,
};
