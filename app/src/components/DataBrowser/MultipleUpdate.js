// @flow

import React, { Component, Fragment } from 'react';
import { Modal, AutoComplete, Icon, Button } from 'antd';
import { connect } from 'react-redux';

import {
	getMappings,
	getColumns,
	getIndexes,
	getTypes,
} from '../../reducers/mappings';
import { getAppname, getUrl } from '../../reducers/app';
import { getSelectedRows } from '../../reducers/selectedRows';
import { META_FIELDS } from '../../utils/mappings';
import labelStyles from '../CommonStyles/label';
import colors from '../theme/colors';
import { bulkUpdate } from '../../apis/data';
import { setError, clearError, updateReactiveList } from '../../actions';

import Flex from '../Flex';
import Cell from '../Cell';

type Props = {
	columns: string[],
	mappings: any,
	appname: string,
	selectedIds: string[],
	appUrl: string,
	indexes: string[],
	types: string[],
	setError: any => void,
	clearError: () => void,
	updateReactiveList: () => void,
};

type State = {
	isShowingModal: boolean,
	data: any,
	isSavingData: boolean,
};

class MultipeUpdate extends Component<Props, State> {
	state = {
		isShowingModal: false,
		data: [
			{
				field: '',
				value: null,
			},
		],
		isSavingData: false,
	};

	handleAfterClose = () => {
		this.setState({
			isShowingModal: false,
			data: [
				{
					field: '',
					value: null,
				},
			],
			isSavingData: false,
		});
	};

	handleSavingDataChange = isSavingData => {
		this.setState({
			isSavingData,
		});
	};

	toggleModal = () => {
		this.setState(prevState => ({
			isShowingModal: !prevState.isShowingModal,
		}));
	};

	handleBulkUpdate = async () => {
		const {
			appUrl,
			indexes,
			types,
			selectedIds,
			setError: onSetError,
			clearError: onClearError,
			updateReactiveList: onUpdateReactiveList,
		} = this.props;
		const { data } = this.state;

		if (data[0].value !== null) {
			this.handleSavingDataChange(true);
			try {
				onClearError();
				await bulkUpdate(
					appUrl,
					indexes.join(','),
					types.join(','),
					selectedIds,
					data,
				);

				this.handleSavingDataChange(false);
				onUpdateReactiveList();
				this.toggleModal();
			} catch (error) {
				this.handleSavingDataChange(false);
				onSetError(error);
			}
		} else {
			this.toggleModal();
		}
	};

	handleColumnChange = (index, column) => {
		const { data } = this.state;
		const hasSameColumn = data.find(item => item.field === column);

		if (!hasSameColumn) {
			this.setState({
				data: [
					...data.slice(0, index),
					{
						field: column,
						value: null,
					},
					...data.slice(index + 1),
				],
			});
		}
	};

	handleRemoveData = index => {
		const { data } = this.state;

		if (data.length > 1) {
			this.setState({
				data: [...data.slice(0, index), ...data.slice(index + 1)],
			});
		} else {
			this.setState({
				data: [
					{
						field: '',
						value: null,
					},
				],
			});
		}
	};

	handleDataValueChange = (index, value) => {
		const { data } = this.state;

		this.setState({
			data: [
				...data.slice(0, index),
				{
					...data[index],
					value,
				},
				...data.slice(index + 1),
			],
		});
	};

	handleAddMoreFields = () => {
		this.setState(prevState => ({
			data: [
				...prevState.data,
				{
					field: '',
					value: null,
				},
			],
		}));
	};

	render() {
		const { data, isShowingModal, isSavingData } = this.state;
		const { columns, mappings, appname, selectedIds } = this.props;
		const { properties } = mappings[appname];
		return (
			<Fragment>
				<Button
					icon="edit"
					type="primary"
					css={{
						margin: '0 3px',
					}}
					onClick={this.toggleModal}
				>
					Update Multiple Rows
				</Button>

				<Modal
					visible={isShowingModal}
					onCancel={this.toggleModal}
					footer={null}
					title={`Update Multiple Rows (${
						selectedIds.length
					} docs selected)`}
					css={{
						top: '10px',
					}}
					className={labelStyles}
					destroyOnClose
					maskClosable={false}
					afterClose={this.handleAfterClose}
				>
					{data.map((item, i) => (
						<Flex
							key={`header-${i}`} // eslint-disable-line
							css={{ marginBottom: 10 }}
							alignItems="center"
						>
							<div css={{ flex: 1, marginLeft: 5 }}>
								<AutoComplete
									dataSource={columns}
									value={item.field}
									placeholder="Field"
									filterOption={(inputValue, option) =>
										option.props.children
											.toUpperCase()
											.indexOf(
												inputValue.toUpperCase(),
											) !== -1
									}
									onChange={column =>
										this.handleColumnChange(i, column)
									}
								/>
							</div>
							<div
								css={{
									flex: 1,
									marginLeft: 10,
								}}
							>
								{item.field ? (
									<div
										css={{
											border: `1px solid ${
												colors.tableBorderColor
											}`,
											borderRadius: 3,
											padding: '5px 7px',
										}}
									>
										<Cell
											mapping={properties[item.field]}
											onChange={val =>
												this.handleDataValueChange(
													i,
													val,
												)
											}
											active
											mode="edit"
											editable
										>
											{item.value}
										</Cell>
									</div>
								) : (
									<div>Please select field...</div>
								)}
							</div>
							<div
								css={{
									marginLeft: 10,
									minWidth: 15,
								}}
							>
								{data.length > 0 && (
									<Icon
										type="close"
										onClick={() => this.handleRemoveData(i)}
										css={{
											cursor: 'pointer',
										}}
									/>
								)}
							</div>
						</Flex>
					))}

					<Flex
						justifyContent="space-between"
						css={{
							marginTop: 25,
						}}
					>
						<Button
							icon="plus"
							type="primary"
							css={{
								marginLeft: 5,
							}}
							onClick={this.handleAddMoreFields}
						/>
						<Button
							onClick={this.handleBulkUpdate}
							loading={isSavingData}
						>
							Save
						</Button>
					</Flex>
				</Modal>
			</Fragment>
		);
	}
}

const mapStateToProps = state => ({
	columns: getColumns(state).filter(x => META_FIELDS.indexOf(x) === -1),
	mappings: getMappings(state),
	appname: getAppname(state),
	appUrl: getUrl(state),
	selectedIds: getSelectedRows(state),
	indexes: getIndexes(state),
	types: getTypes(state),
});

const mapDispatchToProps = {
	setError,
	clearError,
	updateReactiveList,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(MultipeUpdate);