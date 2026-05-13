package db

import "github.com/jackc/pgx/v5"

// BuildBlogPostFilterConditionsForTest exposes the private filter builder for
// unit tests in the db_test package. Only compiled during test runs.
func BuildBlogPostFilterConditionsForTest(filter *BlogPostFilter, args *pgx.NamedArgs) ([]string, error) {
	return buildBlogPostFilterConditions(filter, args)
}
