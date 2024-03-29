# Change Log

SQLRunner version is versioned following [semver](https://semver.org). All new
features and stuff go under `Added`, All fixes go under `Fixed`, deprecated
and removed features go under `Deprecated` and `Removed` respectively.

## Unreleased

### Added

- Activity bar entry for SQL Runner (database icon)
- SQL Runner TreeView based database explorer

### Removed

- SQL Runner WebView based database explorer

## [0.1.1] - 2021-03-15

### Fixed

- Tables not being rendered when connection is made whilst tables pane is closed
- Discarding of connection string on connect error

## [0.1.0] - 2020-12-11

### Added

- Listing of all tables (postgres)
- Describe tables (postgres)
- Added refresh tables command

## [0.0.2] - 2020-12-09

### Added

- Describe tables (MySQL)
- Listing of all tables in database (MySQL)
- Basic loader to indicate that a query is executing
- An error page to display errors in query execution

### Changed

- Run query keybinding to `alt-q e` from `shift-q e`

## [0.0.1] - 2020-11-29

### Added

- MySQL connection adapter
- Postgres connection adapter
